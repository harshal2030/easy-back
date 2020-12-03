import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import { User } from './User';
import { Device } from './Device';

interface StudentAttr {
  id: number;
  classId: string;
  username: string;
}

class Student extends Model implements StudentAttr {
  public id!: number;

  public classId!: string;

  public username!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly student?: User;

  public readonly device?: Device;
}

Student.init({
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Student, StudentAttr };
