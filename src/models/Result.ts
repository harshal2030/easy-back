import { Model, DataTypes, Op } from 'sequelize';
import sequelize from '../db';
import { generateHash } from '../utils/functions';
import { Question } from './Questions';

interface ResultAttr {
  quizId: string;
  responder: string;
  response: {queId: string; response: string;}[];
}

class Result extends Model implements ResultAttr {
  public quizId!: string;

  public responder!: string;

  public response!: {queId: string; response: string}[];

  public static async getCorrectResponses(queInfo: {queId: string; response: string;}[]) {
    const ques = await Question.findAll({
      where: {
        [Op.in]: queInfo.map((que) => que.queId),
      },
      attributes: ['score', 'queId', 'correct'],
    });

    const userResponses = queInfo.map((que) => generateHash(que.response));
    const correctResponses = ques.filter((que) => userResponses.includes(que.correct));

    const totalScore = ques.length === 0 ? 0 : ques.map((que) => que.score).reduce((a, b) => a + b);
    const userScored = correctResponses.length === 0
      ? 0 : correctResponses.map((que) => que.score).reduce((a, b) => a + b);

    return {
      totalScore,
      userScored,
      correct: correctResponses.length,
      incorrect: userResponses.length - correctResponses.length,
    };
  }
}

Result.init({
  quizId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  responder: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  response: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
}, {
  sequelize,
  timestamps: true,
});

export { Result, ResultAttr };
