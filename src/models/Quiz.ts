import { nanoid } from 'nanoid';
/* eslint-disable no-param-reassign */
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface QuizAttr {
  classId: string;
  questions: number;
  quizId: string;
  title: string;
  description: string;
  releaseTime: Date;
  closeTime: Date;
  releaseScore: boolean;
  randomQue: boolean;
  randomOp: boolean;
}

class Quiz extends Model implements QuizAttr {
  public classId!: string;

  public questions!: number;

  public quizId!: string;

  public title!: string;

  public description!: string;

  public releaseTime!: Date;

  public closeTime!: Date;

  public releaseScore!: boolean;

  public randomQue!: boolean;

  public randomOp!: boolean;

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
  releaseTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  closeTime: {
    type: DataTypes.DATE,
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
}, {
  sequelize,
  timestamps: true,
});

export { Quiz, QuizAttr };
