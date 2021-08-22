import { nanoid } from 'nanoid';
/* eslint-disable no-param-reassign */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import { Class } from './Class';
import { Result } from './Result';

interface QuizAttr {
  classId: string;
  questions: number;
  quizId: string;
  title: string;
  description: string;
  timePeriod: [
    {value: Date; inclusive: boolean},
    {value: Date; inclusive: boolean},
  ];
  releaseScore: boolean;
  randomQue: boolean;
  randomOp: boolean;
  multipleSubmit: boolean;
  allowBlur: boolean;
}

class Quiz extends Model implements QuizAttr {
  public classId!: string;

  public questions!: number;

  public quizId!: string;

  public title!: string;

  public description!: string;

  public timePeriod!: [{value: Date; inclusive: boolean }, {value: Date; inclusive: boolean}];

  public releaseScore!: boolean;

  public allowBlur!: boolean;

  public randomQue!: boolean;

  public randomOp!: boolean;

  public multipleSubmit!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Quiz.init({
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  questions: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quizId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    defaultValue: () => nanoid(),
  },
  title: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      max: {
        args: [50],
        msg: 'Only 50 characters are allowed for title',
      },
    },
  },
  description: {
    type: DataTypes.TEXT,
  },
  timePeriod: {
    type: DataTypes.RANGE(DataTypes.DATE),
  },
  releaseScore: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  randomQue: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  randomOp: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  multipleSubmit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  allowBlur: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  sequelize,
  timestamps: true,
});

Quiz.hasMany(Result, {
  as: 'result',
  foreignKey: 'quizId',
  sourceKey: 'quizId',
});

Quiz.belongsTo(Class, {
  as: 'class',
  foreignKey: 'classId',
  targetKey: 'id',
});

export { Quiz, QuizAttr };
