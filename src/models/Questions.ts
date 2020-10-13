import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';
import { Quiz } from './Quiz';
import { generateHash } from '../utils/functions';

interface QuestionAttr {
  quizId: string;
  queId: string;
  question: string;
  attachments: string;
  options: string[];
  correct: string;
}

class Question extends Model implements QuestionAttr {
  public quizId!: string;

  public queId!: string;

  public question!: string;

  public attachments!: string;

  public options!: string[];

  public correct!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  toJSON() {
    return {
      queId: this.queId,
      question: this.question,
      options: this.options,
      attachments: this.attachments,
    };
  }
}

Question.init({
  quizId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Quiz,
      key: 'quizId',
    },
  },
  queId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  question: {
    type: DataTypes.TEXT,
  },
  attachments: {
    type: DataTypes.STRING,
  },
  options: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    validate: {
      checkLength(value: string[]) {
        if (value.length <= 0) {
          throw new Error("Empty options can't be processed");
        }
      },
    },
  },
  correct: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  validate: {
    // eslint-disable-next-line no-unused-vars
    checkCorrectOp(this: QuestionAttr) {
      if (!this.options.includes(this.correct)) {
        throw new Error("options doesn't contain correct option");
      }
    },
  },
  sequelize,
  timestamps: true,
  hooks: {
    afterValidate: (que) => {
      // eslint-disable-next-line no-param-reassign
      que.correct = generateHash(que.correct);
    },
  },
});

export { Question, QuestionAttr };
