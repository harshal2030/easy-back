import { Response } from 'express';
import { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } from 'sequelize';
import { SHA512 } from 'crypto-js';

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

const generatePassword = (password: string, iter: number = 20): string => {
  let pass = password;
  for (let i = 0; i <= iter; i += 1) {
    pass = SHA512(`${process.env.salt1}${pass}${process.env.salt2}`).toString();
  }

  return pass;
};

export { SendOnError, generatePassword };
