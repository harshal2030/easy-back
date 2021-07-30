import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';

interface TopicAttr {
  id: string;
  creator: string;
  classId: string;
  topic: string;
  description: string;
  close: boolean;
  closePermanent: boolean;
}

class Topic extends Model implements TopicAttr {
  public id!: string;

  public creator!: string;

  public classId!: string;

  public topic!: string;

  public description!: string;

  public close!: boolean;

  public closePermanent!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Topic.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  creator: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.length < 1) {
          throw new Error('Invalid creator');
        }
      },
    },
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.length < 1) {
          throw new Error('Invalid class');
        }
      },
    },
  },
  topic: {
    type: DataTypes.STRING(52),
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.length < 1) {
          throw new Error('Topic is required');
        }
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  close: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
  closePermanent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Topic, TopicAttr };
