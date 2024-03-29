import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';

interface QuestionAttr {
  quizId: string;
  queId?: string;
  question: string;
  attachments?: string;
  options: string[];
  correct: string;
  score: number;
}
interface queSheet {
  question: string;
  correct: any;
  score: number;
  [ options: string ]: any;
}

class Question extends Model implements QuestionAttr {
  public quizId!: string;

  public queId!: string;

  public question!: string;

  public attachments!: string;

  public options!: string[];

  public correct!: string;

  public score!: number;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  static formatQueSheet(questions: queSheet[], quizId: string) {
    return questions.map((question) => {
      const data = { ...question };
      const final: QuestionAttr = {
        quizId,
        question: data.question,
        score: data.score,
        correct: data.correct,
        options: [],
      };

      // @ts-ignore
      delete data.correct;
      // @ts-ignore
      delete data.score;
      // @ts-ignore
      delete data.question;

      final.options = Object.values(data);
      return final;
    });
  }

  toJSON() {
    return {
      queId: this.queId,
      question: this.question,
      options: this.options,
      attachments: this.attachments,
      score: this.score,
    };
  }
}

Question.init({
  quizId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  queId: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      checkQuestion(value: string | null) {
        if (!value) {
          throw new Error('Empty questions are not allowed');
        }

        if (value.trim().length === 0) {
          throw new Error('Empty questions are not allowed');
        }
      },
    },
  },
  attachments: {
    type: DataTypes.STRING,
  },
  options: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    set(val: any[]) {
      const values = val.map((v) => v.toString()).filter((v: string) => v.trim().length !== 0);
      this.setDataValue('options', values);
    },
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
    set(val: any) {
      this.setDataValue('correct', val.toString());
    },
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
}, {
  validate: {
    // eslint-disable-next-line no-unused-vars
    checkCorrectOp(this: QuestionAttr) {
      if (!this.options.includes(this.correct)) {
        throw new Error("Options doesn't contain correct option");
      }
    },
  },
  sequelize,
  timestamps: true,
});

export { Question, QuestionAttr, queSheet };
