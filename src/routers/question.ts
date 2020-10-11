import express from 'express';
import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';
import { Question } from '../models/Questions';
import { Quiz } from '../models/Quiz';
import { SendOnError } from '../utils/functions';

const router = express.Router();

// TODO: add attachment to question
router.post('/:classId/:quizId', auth, mustBeClassOwner, async (req, res) => {
  if (req.body.queId || req.body.quizId || req.body.classId) {
    return res.status(400).send({ error: 'Invalid params' });
  }
  try {
    const quizExists = await Quiz.findOne({
      where: {
        quizId: req.params.quizId,
        classId: req.params.classId,
      },
    });

    if (!quizExists) {
      return res.status(400).send({ error: 'Please check your info correctly' });
    }

    const que = await Question.create({ ...req.body, quizId: req.params.quizId });

    return res.send({
      queId: que.queId,
      quizId: que.quizId,
      question: que.question,
      options: que.options,
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
