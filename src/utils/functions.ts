import { Response } from 'express';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';

const SendOnError = (e: Error, res: Response): Response<any> => {
  if (e instanceof ValidationError) {
    return res.status(400).send({ error: e.message.replace('Validation error: ', '') });
  }

  if (e instanceof UniqueConstraintError) {
    return res.status(400).send({ error: e.message });
  }

  if (e instanceof ForeignKeyConstraintError) {
    return res.status(400).send({ error: e.message });
  }

  return res.status(500).send();
};

// eslint-disable-next-line import/prefer-default-export
export { SendOnError };
