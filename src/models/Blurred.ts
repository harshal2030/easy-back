import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';

interface BlurredAttr {
  id: string;
  username: string;
  quizId: string;
}

class Blurred extends Model implements BlurredAttr {
  public id!: string;

  public username!: string;

  public quizId!: string;

  public readonly createdAt!: Date;
}

Blurred.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  username: {
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
  quizId: {
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
}, {
  sequelize,
  timestamps: true,
  updatedAt: false,
});

export { Blurred, BlurredAttr };
