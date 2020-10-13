import express from 'express';
import sequelize from '../db';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { Question } from '../models/Questions';
import { Quiz } from '../models/Quiz';
import { SendOnError, shuffleArray } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  if (req.body.quizId) {
    return res.status(400).send({ Error: 'Invalid params' });
  }
  try {
    const quiz = await Quiz.create({
      ...req.body,
      classId: req.params.classId,
    });

    return res.send(quiz);
  } catch (e) {
    return SendOnError(e, res);
  }
});

// TODO: send response according to attributes in a quiz
router.get('/:classId/:quizId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: {
        classId: req.params.classId,
        quizId: req.params.quizId,
      },
    });

    if (!quiz) {
      return res.status(404).send({ error: 'No such quiz found' });
    }

    const now = new Date().getTime();

    if (now < quiz.releaseTime.getTime()) {
      return res.status(400).send({ error: "It's not accepting response anymore" });
    }

    if (quiz.closeTime && now > quiz.closeTime.getTime()) {
      return res.status(400).send({ error: "It's not accepting response anymore" });
    }

    let questions;

    if (quiz.randomQue) {
      questions = await Question.findAll({
        where: {
          quizId: req.params.quizId,
        },
        attributes: ['question', 'options', 'queId', 'attachments'],
        order: sequelize.random(),
        limit: quiz.questions,
      });
    } else {
      questions = await Question.findAll({
        where: {
          quizId: req.params.quizId,
        },
        attributes: ['question', 'options', 'queId', 'attachments'],
        limit: quiz.questions,
      });
    }

    if (quiz.randomOp) {
      questions.forEach((que) => shuffleArray<string>(que.options));
    }

    return res.send(questions);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
