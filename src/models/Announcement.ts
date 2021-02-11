import { nanoid } from 'nanoid';
import { Model, DataTypes } from 'sequelize';

import sequelize from '../db';
import { User } from './User';

interface AnnouncementAttr {
  id: string;
  author: string;
  message: string;
  classId: string;
}

class Announcement extends Model implements AnnouncementAttr {
  public id!: string;

  public author!: string;

  public message!: string;

  public classId!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly user?: User;
}

Announcement.init({
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
    unique: true,
    defaultValue: () => nanoid(25),
    set() {
      this.setDataValue('id', nanoid(25));
    },
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
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
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

Announcement.belongsTo(User, {
  as: 'user',
  foreignKey: 'author',
  targetKey: 'username',
});

export { Announcement, AnnouncementAttr };
