import { nanoid } from 'nanoid';
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface AnnouncementAttr {
  id: string;
  message: string;
}

class Announcement extends Model implements AnnouncementAttr {
  public id!: string;

  public message!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Announcement.init({
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
    unique: true,
    defaultValue: () => nanoid(25),
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      checkValue(value: string) {
        if (value.trim().length === 0) {
          throw new Error('Empty messages are not allowed');
        }
      },
    },
  },
}, {
  sequelize,
  timestamps: true,
});

export { Announcement, AnnouncementAttr };
