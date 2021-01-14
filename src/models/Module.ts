import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

interface ModuleAttr {
  id: string;
  title: string;
  classId: string;
}

class Module extends Model implements ModuleAttr {
  public id!: string;

  public title!: string;

  public classId!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Module.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
    allowNull: false,
    set() {
      this.setDataValue('id', nanoid());
    },
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Module, ModuleAttr };
