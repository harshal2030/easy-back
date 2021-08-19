import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface AllowedPeopleAttr {
  id: number;
  classId: string;
  username: string;
}

class AllowedPeople extends Model implements AllowedPeopleAttr {
  public id!: number;

  public classId!: string;

  public username!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

AllowedPeople.init({
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { AllowedPeople, AllowedPeopleAttr };
