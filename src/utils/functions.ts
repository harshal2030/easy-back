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

const generateHash = (text: string, iter: number = 20): string => {
  let hash = text;
  for (let i = 0; i <= iter; i += 1) {
    hash = SHA512(`${process.env.salt1}${hash}${process.env.salt2}`).toString();
  }

  return hash;
};

const shuffleArray = <T>(arr: T[]): T[] => {
  const shuffleArr = arr;
  let currentIndex = arr.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    const tempValue = shuffleArr[currentIndex];
    shuffleArr[currentIndex] = shuffleArr[randomIndex];
    shuffleArr[randomIndex] = tempValue;
  }

  return shuffleArr;
};

export {
  SendOnError, generateHash, shuffleArray,
};
