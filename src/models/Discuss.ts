import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';

interface DiscussAttr {
  id: string;
  classId: string;
  author: string;
  title: string;
  private: boolean;
  closed: boolean;
  locked: boolean;
  tags: string[];
}

class Discuss extends Model implements DiscussAttr {
  public id!: string;

  public classId!: string;

  public author!: string;

  public title!: string;

  public private!: boolean;

  public closed!: boolean;

  public locked!: boolean;

  public tags!: string[];

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Discuss.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(30),
  },
  classId: {
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
  title: {
    type: DataTypes.STRING(52),
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1 || value.trim().length > 50) {
          throw new Error('Title too large, must be within 50 character long');
        }
      },
    },
  },
  private: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  closed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  locked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: [],
  },
}, {
  sequelize,
  timestamps: true,
});

export { Discuss, DiscussAttr };
