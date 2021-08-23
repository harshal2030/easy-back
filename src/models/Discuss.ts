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
  closedPermanent: boolean;
  tags: string[];
}

class Discuss extends Model implements DiscussAttr {
  public id!: string;

  public classId!: string;

  public author!: string;

  public title!: string;

  public private!: boolean;

  public closed!: boolean;

  public closedPermanent!: boolean;

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
  },
  private: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: false,
  },
  closed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  closedPermanent: {
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
