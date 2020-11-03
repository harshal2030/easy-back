import express from 'express';
import sequelize from '../db';

import { Question } from '../models/Questions';
import { Quiz } from '../models/Quiz';
import { Result } from '../models/Result';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError, shuffleArray } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  if (req.body.quizId) {
    return res.status(400).send({ Error: 'Invalid params' });
  }

  const range = req.body.timePeriod ? [
    { value: req.body.timePeriod[0], inclusive: true },
    { value: req.body.timePeriod[1], inclusive: true },
  ] : null;

  try {
    const quiz = await Quiz.create({
      ...req.body,
      timePeriod: range,
      classId: req.params.classId,
    });

    return res.status(201).send(quiz);
  } catch (e) {
    return SendOnError(e, res);
  }
});

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

    if (quiz.timePeriod[0].value.getTime() > now || quiz.timePeriod[1].value.getTime() < now) {
      return res.status(400).send({ error: 'No longer accepting response' });
    }

    let questions;

    if (quiz.randomQue) {
      questions = await Question.findAll({
        where: {
          quizId: req.params.quizId,
        },
        attributes: ['question', 'options', 'queId', 'attachments', 'score'],
        order: sequelize.random(),
        limit: quiz.questions,
      });
    } else {
      questions = await Question.findAll({
        where: {
          quizId: req.params.quizId,
        },
        attributes: ['question', 'options', 'queId', 'attachments', 'score'],
        limit: quiz.questions,
      });
    }

    const totalScore = questions.length === 0
      ? 0 : questions.map((que) => que.score).reduce((a, b) => a + b);

    if (quiz.randomOp) {
      questions.forEach((que) => shuffleArray<string>(que.options));
    }

    return res.send({ questions, totalScore, quizId: quiz.quizId });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.post('/:classId/:quizId', auth, mustBeStudentOrOwner, async (req, res) => {
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

    const response = await Result.create({
      quizId: req.params.quizId,
      responder: req.user!.username,
      response: req.body.response,
    });

    if (quiz.releaseScore) {
      const summary = Result.getCorrectResponses(response.response);
      return res.send({
        totalQues: quiz.questions,
        ...summary,
      });
    }

    return res.send();
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
