import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

interface QHubAttr {
  id: string;
  classId: string;
  title: string;
  message: string;
  replyTo: string | null;
  parentId: string | null;
  attachment: string[];
}

class QHub extends Model implements QHubAttr {
  public id!: string;

  public classId!: string;

  public title!: string;

  public message!: string;

  public replyTo!: string | null;

  public parentId!: string | null;

  public attachment!: string[];

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

QHub.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => nanoid(),
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      checkLength(value: string) {
        if (value.trim().length === 0) {
          throw new Error('Empty title not allowed');
        }
      },
    },
  },
  message: {
    type: DataTypes.STRING,
  },
  replyTo: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  parentId: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  attachment: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
}, {
  sequelize,
  timestamps: true,
});
