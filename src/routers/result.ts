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
        releaseScore: true,
      },
    });

    if (!quiz) {
      return res.status(404).send({ error: 'Requested object not found' });
    }

    const response = await Result.getResponses(req.user!.username, quiz.quizId);

    if (response.length === 0) {
      return res.status(404).send();
    }

    const scoreSummary = Result.getScoreSummary(response);
    return res.send(scoreSummary);
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

    const results = await Result.getAllResponses(quiz.quizId);

    const rtl: {
      totalScore: number;
      userScored: number;
      correct: number;
      incorrect: number;
      totalQues: number;
      responder: string;
      notAnswered: number;
    }[] = [];

    const responders = Object.keys(results);
    responders.forEach((resp) => {
      const scoreSummary = Result.getScoreSummary(results[resp]);
      rtl.push({
        ...scoreSummary,
        responder: results[resp][0].responder.name,
      });
    });

    const file = XLSX.utils.json_to_sheet(rtl);

    const stream: NodeJS.ReadWriteStream = XLSX.stream.to_csv(file);

    res.setHeader('Content-disposition', `attachment; filename="${quiz.title}.csv"`);
    res.set('Content-Type', 'text/csv');
    stream.pipe(res);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
