import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';
import { User } from './User';
import { Student } from './Student';

interface ClassAttr {
  id: string;
  name: string;
  about: string;
  subject: string;
  owner: string;
  photo: string;
  collaborators: string[];
  joinCode: string;
  lockJoin: boolean;
}

class Class extends Model implements ClassAttr {
  public id!: string;

  public name!: string;

  public about!: string;

  public subject!: string;

  public owner!: string;

  public photo!: string;

  public collaborators!: string[];

  public joinCode!: string;

  public lockJoin!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Class.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false,
    defaultValue: () => nanoid(),
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      checkEmptyString(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Name is required for the class');
        }
      },
    },
  },
  about: {
    type: DataTypes.TEXT,
  },
  subject: {
    type: DataTypes.STRING,
    validate: {
      checkEmptySub(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Please enter the subject for your class');
        }
      },
    },
  },
  owner: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'username',
    },
  },
  photo: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  collaborators: {
    type: DataTypes.ARRAY(DataTypes.STRING(255)),
    defaultValue: [],
  },
  joinCode: {
    type: DataTypes.STRING,
    defaultValue: () => nanoid(12),
  },
  lockJoin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize,
  timestamps: true,
});

Class.hasMany(Student, {
  sourceKey: 'id',
  foreignKey: 'classId',
  as: 'studentRef',
});

Class.belongsTo(User, {
  as: 'ownerRef',
  foreignKey: 'owner',
  targetKey: 'username',
});

export { Class, ClassAttr };
