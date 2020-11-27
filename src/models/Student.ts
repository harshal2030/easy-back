import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import { Class } from './Class';
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
    references: {
      model: Class,
      key: 'id',
    },
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

Student.belongsTo(Device, {
  as: 'device',
  foreignKey: 'username',
  targetKey: 'username',
});

Student.belongsTo(User, {
  foreignKey: 'username',
  targetKey: 'username',
  as: 'student',
});

export { Student, StudentAttr };
