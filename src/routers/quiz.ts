import express from 'express';
import slugify from 'slugify';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';
import { Quiz } from '../models/Quiz';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  if (req.body.slug) {
    return res.status(400).send({ Error: 'Invalid params' });
  }
  try {
    const quiz = await Quiz.create({
      ...req.body,
      classId: req.params.classId,
      slug: slugify(req.body.title),
    });

    return res.send(quiz);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
