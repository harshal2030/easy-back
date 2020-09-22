import express, { Request, Response } from 'express';

import { SendOnError } from '../utils/functions';

import { Class } from '../models/Class';

import { auth } from '../middlewares/auth';

const router = express.Router();

router.post('/class/create', auth, async (req: Request, res: Response) => {
  const queries = Object.keys(req.body);
  const allowedQueries = ['name', 'about'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid param sent' });
  }
  try {
    const section = await Class.create({ owner: req.user!.username, ...req.body });

    return res.status(201).send(section);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
