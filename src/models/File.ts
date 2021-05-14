import { nanoid } from 'nanoid';
import { DataTypes, Model } from 'sequelize';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';

import sequelize from '../db';
import { FileStorage } from '../services/FileStorage';

interface FileAttr {
  id: string;
  moduleId: string;
  title: string;
  filename: string;
  preview: string | null;
}

class File extends Model implements FileAttr {
  public id!: string;

  public moduleId!: string;

  public title!: string;

  public filename!: string;

  public preview!: string | null;

  public static async mp4ToHls480p(mp4VideoPath: string, fileId: string) {
    try {
      const filename = `${nanoid()}.m3u8`;

      ffmpeg(mp4VideoPath).addOptions([
        '-profile:v main',
        '-vf scale=w=842:h=480:force_original_aspect_ratio=decrease',
        '-c:a aac',
        '-ar 48000',
        '-b:a 128k',
        '-c:v h264',
        '-crf 20',
        '-g 48',
        '-keyint_min 48',
        '-sc_threshold 0',
        '-b:v 1400k',
        '-maxrate 1498k',
        '-bufsize 2100k',
        '-hls_time 10',
        '-f hls',
      ])
        .output(path.join(__dirname, `../../../media/class/hls/${filename}`))
        .on('end', () => {
          File.update({
            filename,
          }, {
            where: {
              id: fileId,
            },
          });

          FileStorage.deleteFileFromPath(mp4VideoPath);
        })
        .run();
    } catch (e) {
      // move on
    }
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
}, {
  sequelize,
  timestamps: true,
});

export { File, FileAttr };
