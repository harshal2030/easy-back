/* eslint-disable import/prefer-default-export */
import { Response, Request, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';

import path from 'path';
import fs from 'fs';

import { User } from '../models/User';

const publicKeyPath = path.join(__dirname, '../../../keys/public.pem');
const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')!.replace('Bearer ', '');
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as {username: string;};

    const user = await User.findOne({
      where: {
        username: decoded.username,
        tokens: {
          [Op.contains]: [token],
        },
      },
    });

    if (!user) {
      throw new Error();
    }

    req.user = user;
    req.token = token;
    next();
  } catch (e) {
    res.status(401).send();
  }
};

const checkOnlyToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization');
    if (token) {
      const tokenToVerify = token.replace('Bearer ', '');
      jwt.verify(tokenToVerify, publicKey, { algorithms: ['RS256'] });
      next();
    } else if (req.signedCookies.pass) {
      const tokenToVerify = req.signedCookies.pass;
      jwt.verify(tokenToVerify, process.env.cookieSecret!);
      next();
    } else {
      throw new Error();
    }
  } catch (e) {
    res.status(401).send();
  }
};

export { auth, checkOnlyToken };
