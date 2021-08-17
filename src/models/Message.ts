import { DataTypes, Model } from 'sequelize';
import { nanoid } from 'nanoid';

import { User } from './User';
import sequelize from '../db';

interface MessageAttr {
  id: string;
  discussId: string;
  message: string;
  author: string;
  file: string | null;
}

class Message extends Model implements MessageAttr {
  public id!: string;

  public discussId!: string;

  public message!: string;

  public author!: string;

  public file!: string | null;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Message.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  discussId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('invalid id');
        }
      },
    },
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Invalid user');
        }
      },
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error();
        }
      },
    },
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  sequelize,
  timestamps: true,
});

Message.belongsTo(User, {
  as: 'user',
  targetKey: 'username',
  foreignKey: 'author',
});

export { Message, MessageAttr };
