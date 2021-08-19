import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

interface AssignmentAttr {
  id: string;
  title: string;
  description: string;
  classId: string;
  author: string;
  file: string | null;
  related: string[];
  dueDate: Date;
  allowLate: boolean;
}

class Assignment extends Model implements AssignmentAttr {
  public id!: string;

  public title!: string;

  public description!: string;

  public classId!: string;

  public author!: string;

  public file!: string | null;

  public dueDate!: Date;

  public related!: string[];

  public allowLate!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Assignment.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  title: {
    type: DataTypes.STRING(52),
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1 || value.trim().length > 50) {
          throw new Error('Invalid title');
        }
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Invalid class');
        }
      },
    },
  },
  author: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      check(value: string) {
        if (value.trim().length < 1) {
          throw new Error('No such user');
        }
      },
    },
  },
  related: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true,
    defaultValue: null,
  },
  file: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  allowLate: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Assignment, AssignmentAttr };
