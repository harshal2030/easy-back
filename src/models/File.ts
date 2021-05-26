import { nanoid } from 'nanoid';
import { DataTypes, Model, Op } from 'sequelize';
import ffmpeg from 'fluent-ffmpeg';

import { VideoTracker } from './VideoTracker';
import { Module } from './Module';

import sequelize from '../db';

import { previewFilePath, modulePath } from '../utils/paths';

import { FileStorage } from '../services/FileStorage';
import { Class } from './Class';

interface FileAttr {
  id: string;
  moduleId: string;
  title: string;
  filename: string;
  preview: string | null;
  fileSize: string; // sequelize return bigint as string
}

class File extends Model implements FileAttr {
  public id!: string;

  public moduleId!: string;

  public title!: string;

  public filename!: string;

  public preview!: string | null;

  public fileSize!: string;

  static async onSuccessProcessVideo(videoData: {
    moduleId: string; title: string; filename: string; preview: string; fileSize: number;
  }, classId: string, oldVideoPath?: string) {
    const t = await sequelize.transaction();

    try {
      const fileRef = File.create(videoData, {
        transaction: t,
      });
      const classRef = Class.increment('storageUsed', {
        by: videoData.fileSize,
        where: {
          id: classId,
        },
        transaction: t,
      });

      if (oldVideoPath) {
        FileStorage.deleteFileFromPath(oldVideoPath);
      }

      await Promise.all([fileRef, classRef]);
      await t.commit();
    } catch (e) {
      await t.rollback();
    }
  }

  static async bulkDeleteFiles(files: File[], classId: string, moduleId: string) {
    const t = await sequelize.transaction();

    try {
      const moduleRef = await Module.destroy({
        where: {
          id: moduleId,
          classId,
        },
        transaction: t,
      });

      const fileRef = await File.destroy({
        where: {
          moduleId,
        },
        transaction: t,
      });

      const filesIds = files.map((file) => {
        FileStorage.deleteFile(file.filename, modulePath);
        FileStorage.deleteFile(file.preview!, previewFilePath);

        return file.id;
      });
      const fileSizeArray = files.map((file) => parseInt(file.fileSize, 10));
      const totalFileSize = fileSizeArray.length === 0 ? 0 : fileSizeArray.reduce((a, b) => a + b);

      const videoRef = await VideoTracker.destroy({
        where: {
          videoId: {
            [Op.in]: filesIds,
          },
        },
        transaction: t,
      });

      await Promise.all([moduleRef, fileRef, videoRef]);

      await Class.increment('storageUsed', {
        by: -totalFileSize,
        where: {
          id: classId,
        },
        transaction: t,
      });

      await t.commit();
    } catch (err) {
      await t.rollback();
    }
  }

  static async deleteFile(file: File, classId: string) {
    const t = await sequelize.transaction();

    await File.destroy({
      where: {
        id: file.id,
        moduleId: file.moduleId,
      },
      limit: 1,
      transaction: t,
    });

    await VideoTracker.destroy({
      where: {
        videoId: file.id,
      },
      transaction: t,
    });

    await Class.increment('storageUsed', {
      by: -file.fileSize,
      where: {
        id: classId,
      },
    });

    await t.commit();

    FileStorage.deleteFile(file.preview!, previewFilePath);
    FileStorage.deleteFile(file.filename, modulePath);
  }

  // when using HLS streaming but not now
  static processVideo(
    videoData: {videoPath: string; title: string; moduleId: string; classId: string},
  ) {
    const {
      videoPath, title, moduleId, classId,
    } = videoData;
    const filename = nanoid(); // will be used for both preview and actual file
    const previewFileName = `${filename}.png`;
    const actualFileName = `${filename}.m3u8`;
    let fileSize: number;

    ffmpeg(videoPath).takeScreenshots({
      timemarks: [1],
      count: 1,
      filename: previewFileName,
    }, previewFilePath);

    ffmpeg.ffprobe(videoPath, (err, data) => {
      if (!err) {
        fileSize = data.format.size!;
      }
    });

    ffmpeg(videoPath)
      .size('?x720')
      .addOptions([
        '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
        '-level 3.0',
        '-start_number 0',
        '-vcodec libx264',
        '-crf 23', // start the first .ts segment at index 0
        '-hls_time 10', // 10 second segment duration
        '-hls_list_size 0', // Maximum number of playlist entries (0 means all entries/infinite)
        '-f hls',
      ])
      .output(`${modulePath}/${actualFileName}`)
      .on('end', async () => {
        await File.onSuccessProcessVideo({
          moduleId,
          filename: actualFileName,
          fileSize,
          title,
          preview: previewFileName,
        }, classId, videoPath);
      })
      .on('error', () => {
        FileStorage.deleteFileFromPath(videoPath);
      })
      .run();
  }
}

File.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    defaultValue: () => nanoid(30),
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      checkTitle(value: string) {
        if (value.trim().length === 0) {
          throw new Error('Invalid title');
        }
      },
    },
  },
  moduleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  preview: {
    type: DataTypes.STRING(50),
  },
  fileSize: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { File, FileAttr };
