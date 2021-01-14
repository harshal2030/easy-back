import { nanoid } from 'nanoid';
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface FileAttr {
  id: string;
  moduleId: string;
  title: string;
  filename: string;
}

class File extends Model implements FileAttr {
  public id!: string;

  public moduleId!: string;

  public title!: string;

  public filename!: string;
}

File.init({
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
    allowNull: false,
    defaultValue: () => nanoid(),
    set() {
      this.setDataValue('id', nanoid());
    },
  },
  moduleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  filename: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { File, FileAttr };
