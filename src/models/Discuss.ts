import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';

interface DiscussAttr {
  id: string;
  author: string;
  title: string;
  classId: string;
  private: boolean;
  closed: boolean;
  closedPermanent: boolean;
}

class Discuss extends Model implements DiscussAttr {
  public id!: string;

  public author!: string;

  public title!: string;

  public classId!: string;

  public private!: boolean;

  public closed!: boolean;

  public closedPermanent!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Discuss.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(30),
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('No such user found');
        }
      },
    },
  },
  title: {
    type: DataTypes.STRING(55),
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Please enter valid title');
        }
      },
    },
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Please enter valid title');
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
  closedPermanent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Discuss, DiscussAttr };
