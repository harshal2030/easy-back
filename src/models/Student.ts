import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import { Class } from './Class';

interface StudentAttr {
  classId: string;
  username: string;
}

class Student extends Model implements StudentAttr {
  public classId!: string;

  public username!: string;
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

export { Student, StudentAttr };
