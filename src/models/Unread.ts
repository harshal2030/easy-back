import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

interface UnreadAttr {
  id: number;
  classId: string;
  username: string;
  lastMessageRead: Date;
}

class Unread extends Model implements UnreadAttr {
  public id!: number;

  public classId!: string;

  public username!: string;

  public lastMessageRead!: Date;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Unread.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastMessageRead: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
  updatedAt: false,
});

export { Unread, UnreadAttr };
