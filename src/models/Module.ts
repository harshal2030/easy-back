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
    unique: true,
    defaultValue: () => nanoid(22),
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      checkTitle(value: string) {
        if (value.trim().length < 1 || value.trim().length > 50) {
          throw new Error('Title out of range');
        }
      },
    },
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { ModuleAttr, Module };
