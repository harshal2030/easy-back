import express, { Request, Response } from 'express';
import { ValidationError, UniqueConstraintError } from 'sequelize';

import { User } from '../models/User';

const router = express.Router();

interface SignUpReq extends Request {
  body: {
    user: {
      name: string;
      username: string;
      email: string;
      password: string;
    }
  }
}

interface LoginReq extends Request {
  body: {
    user: {
      username: string;
      password: string;
    }
  }
}

router.post('/users/create', async (req: SignUpReq, res: Response) => {
  const queries = Object.keys(req.body.user);
  const allowedQueries = ['name', 'username', 'email', 'password'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.send({ error: 'Bad request parameters' });
  }
  try {
    const user = await User.create(req.body.user);
    const token = await user.generateJwt();

    return res.status(201).send({ user, token });
  } catch (e) {
    if (e instanceof ValidationError) {
      return res.status(400).send({ error: e.message });
    }

    if (e instanceof UniqueConstraintError) {
      return res.status(400).send({ error: e.message });
    }
    return res.status(500).send();
  }
});

router.post('/users/login', async (req: LoginReq, res: Response) => {
  try {
    const user = await User.checkUsernameAndPass(req.body.user.username, req.body.user.password);
    const token = await user.generateJwt();

    res.send({ user, token });
  } catch (e) {
    res.status(404).send();
  }
});

export default router;
