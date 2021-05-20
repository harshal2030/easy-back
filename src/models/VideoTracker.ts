import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

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
    allowNull: false,
  },
  stop: {
    type: DataTypes.DATE,
    allowNull: false,
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
