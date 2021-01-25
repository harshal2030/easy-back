import { Model, DataTypes } from 'sequelize';
import _ from 'lodash';
import Joi from 'joi';
import sequelize from '../db';

const schemaObject = Joi.object().keys({
  queId: Joi.string().required(),
  response: Joi.string().required(),
});

const schema = Joi.array().items(schemaObject);

interface ResultAttr {
  quizId: string;
  responder: string;
  response: {queId: string; response: string;}[];
}

class Result extends Model implements ResultAttr {
  public quizId!: string;

  public responder!: string;

  public response!: {queId: string; response: string}[];

  public static getScoreSummary(queInfo: {
    queId: string; response: string; correct: string; score: number;
  }[]) {
    let totalScore = 0;
    let userScored = 0;
    let correct = 0;
    let incorrect = 0;

    queInfo.forEach((que) => {
      totalScore += que.score;

      if (que.response === que.correct) {
        userScored += que.score;
        correct += 1;
      } else {
        incorrect += 1;
      }
    });

    return {
      totalScore,
      userScored,
      correct,
      incorrect,
      totalQues: queInfo.length,
    };
  }

  static async getResponses(responder: string, quizId: string) {
    const result = await sequelize.query(`WITH res AS (
        SELECT "queId", items.response, "quizId", "responder" "responder.username" FROM "Results",
        jsonb_to_recordset("Results".response) AS items("queId" VARCHAR(30), response TEXT)
        WHERE "quizId"=:quizId AND responder = :responder
      )
      SELECT score, response, q.correct, q."queId", "responder.username"
      FROM "Questions" q INNER JOIN res USING("queId")`, {
      replacements: { quizId, responder },
      raw: true,
      nest: true,
    });

    return result as unknown as {
      score: number; response: string; correct: string; queId: string; responder: {username: string}
    }[];
  }

  static async getAllResponses(quizId: string) {
    const q = await sequelize.query(`WITH res AS (
      SELECT "queId", items.response, "quizId", "responder" FROM "Results",
      jsonb_to_recordset("Results".response) AS items("queId" VARCHAR(30), response TEXT)
      WHERE "quizId"=:quizId
    )
    SELECT score, response, q.correct, q."queId", responder "responder.username", u.name "responder.name"
    FROM "Questions" q INNER JOIN res USING("queId")
    INNER JOIN "Users" u ON responder = u.username`, {
      replacements: { quizId },
      raw: true,
      nest: true,
    });

    const raw = q as unknown as {
      score: number; response: string; correct: string; queId: string; responder: {
        username: string; name: string;
      };
    }[];

    const result = _.groupBy(raw, (res) => res.responder.username);

    return result;
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
    validate: {
      validateResArray(value: any) {
        const { error } = schema.validate(value);
        if (error) {
          throw new Error('Bad response structure');
        }
      },
    },
  },
}, {
  sequelize,
  timestamps: true,
});

export { Result, ResultAttr };
