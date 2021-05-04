import { nanoid } from 'nanoid';
import { DataTypes, Model } from 'sequelize';
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
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
    unique: true,
    defaultValue: () => nanoid(30),
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      checkTitle(value: string) {
        if (value.trim().length === 0) {
          throw new Error('Invalid title');
        }
      },
    },
  },
  moduleId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  preview: {
    type: DataTypes.STRING(50),
  },
}, {
  sequelize,
  timestamps: true,
});

export { File, FileAttr };
