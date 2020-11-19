import express from 'express';
import XLSX from 'xlsx';

import { Quiz } from '../models/Quiz';
import { Result } from '../models/Result';

import { auth } from '../middlewares/auth';
import { mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.get('/:classId/:quizId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: {
        quizId: req.params.quizId,
        classId: req.params.classId,
      },
    });

    if (!quiz) {
      return res.status(404).send({ error: 'Requested object not found' });
    }

    const rawResult = await Result.findOne({
      where: {
        quizId: quiz.quizId,
        responder: req.user!.username,
      },
      attributes: ['response'],
    });

    if (!rawResult) {
      return res.status(404).send({ error: 'Requested object not found' });
    }

    const summary = await Result.getCorrectResponses(rawResult.response);
    return res.send({
      ...summary,
      totalQues: rawResult.response.length,
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.get('/file/:classId/:quizId', async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: {
        classId: req.params.classId,
        quizId: req.params.quizId,
      },
    });

    if (!quiz) {
      throw new Error();
    }

    const results = await Result.findAll({
      where: {
        quizId: req.params.quizId,
      },
    });

    const file = XLSX.utils.json_to_sheet(results.map((val) => ({
      id: val.quizId,
      user: val.responder,
    })));

    const stream = XLSX.stream.to_csv(file);

    res.setHeader('Content-disposition', `attachment; filename=${quiz.title}.csv`);
    res.set('Content-Type', 'text/csv');
    stream.pipe(res);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
