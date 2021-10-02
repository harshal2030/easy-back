import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import { User } from './User';

import sequelize from '../db';

interface MessageAttr {
  id: string;
  refId: string;
  message: string;
  author: string;
  private: boolean;
  file: string | null;
}

class Message extends Model implements MessageAttr {
  public id!: string;

  public refId!: string;

  public message!: string;

  public private!: boolean;

  public author!: string;

  public file!: string | null;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Message.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(35),
  },
  refId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Invalid author');
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
          throw new Error('Invalid author');
        }
      },
    },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  private: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: false,
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  validate: {
    // eslint-disable-next-line no-unused-vars
    checkMessage(this: MessageAttr) {
      if (!this.file && this.message.trim().length === 0) {
        throw new Error('Invalid message');
      }
    },
  },
  sequelize,
  timestamps: true,
});

Message.belongsTo(User, {
  as: 'user',
  targetKey: 'username',
  foreignKey: 'author',
});

export { Message, MessageAttr };
