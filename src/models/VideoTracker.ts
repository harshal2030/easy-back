import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';
import { File } from './File';

interface VideoTrackerAttr {
  id: string;
  username: string;
  videoId: string;
  start: Date;
  stop: Date;
}

class VideoTracker extends Model implements VideoTrackerAttr {
  public id!: string;

  public username!: string;

  public videoId!: string;

  public start!: Date;

  public stop!: Date;

  public readonly createdAt!: Date;

  static async createTrackerNonVideo(username: string, filename: string) {
    const file = await File.findOne({
      where: {
        filename,
      },
    });

    if (file) {
      await VideoTracker.create({
        username,
        videoId: file.id,
      });
    }
  }
}

VideoTracker.init({
  id: {
    type: DataTypes.STRING(30),
    allowNull: false,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  videoId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  start: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  stop: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  sequelize,
  timestamps: false,
});

export { VideoTracker, VideoTrackerAttr };
