import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';
import { User } from './User';

interface ClassAttr {
  id: string;
  name: string;
  about: string;
  owner: string;
  photo: string;
  collaborators: string[];
}

class Class extends Model implements ClassAttr {
  public id!: string;

  public name!: string;

  public about!: string;

  public owner!: string;

  public photo!: string;

  public collaborators!: string[];

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
  },
  about: {
    type: DataTypes.STRING(1000),
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
}, {
  sequelize,
  timestamps: true,
});

export { Class, ClassAttr };
