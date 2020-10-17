import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface ResultAttr {
  quizId: string;
  responder: string;
  response: {queId: string; response: string;}[];
}

class Result extends Model implements ResultAttr {
  public quizId!: string;

  public responder!: string;

  public response!: {queId: string; response: string}[];
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
