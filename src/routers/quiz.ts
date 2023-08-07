import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { Op, Sequelize } from 'sequelize';
import sequelize from '../db';

import { Question, queSheet } from '../models/Questions';
import { Quiz } from '../models/Quiz';
import { Result } from '../models/Result';
import { Class } from '../models/Class';
import { Blurred } from '../models/Blurred';
import { Student } from '../models/Student';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError, shuffleArray } from '../utils/functions';

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 50 * 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'sheet', maxCount: 1 },
]);

router.post('/:classId', auth, mustBeClassOwner, mediaMiddleware, async (req, res) => {
  const data = JSON.parse(req.body.info);
  const queries = Object.keys(data);
  const allowedQueries = ['questions', 'title', 'description', 'timePeriod', 'releaseScore', 'randomQue', 'randomOp', 'showScore', 'allowBlur'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    res.status(400).send({ error: 'Invalid params sent' });
  }

  const range = data.timePeriod ? [
    { value: data.timePeriod[0], inclusive: true },
    { value: data.timePeriod[1], inclusive: true },
  ] : null;

  const t = await sequelize.transaction();

  try {
    const quizCreatedCount = await Quiz.count({
      where: {
        classId: req.params.classId,
      },
    });

    if (quizCreatedCount >= 10 && req.ownerClass!.planId === 'free') {
      res.status(400).send({ error: 'Test quota limit reached for this class' });
      return;
    }

    const quiz = await Quiz.create({
      ...data,
      timePeriod: range,
      classId: req.params.classId,
    }, {
      transaction: t,
    });

    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
    if (files.sheet) {
      const workbook = XLSX.read(files.sheet[0].buffer);
      const sheets = workbook.SheetNames;
      const queData = XLSX.utils.sheet_to_json<queSheet>(workbook.Sheets[sheets[0]]);
      const formattedData = Question.formatQueSheet(queData, quiz.quizId);

      // @ts-ignore
      await Question.bulkCreate(formattedData, { transaction: t });
    }
    await t.commit();

    res.status(201).send(quiz);
  } catch (e) {
    await t.rollback();
    SendOnError(e, res);
  }
});

router.post('/blur/:classId/:quizId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const quizExists = await Quiz.findOne({
      where: {
        classId: req.params.classId,
        quizId: req.params.quizId,
      },
    });

    if (!quizExists) {
      res.status(400).send({ error: 'No such resource exists' });
      return;
    }

    if (quizExists.allowBlur) {
      res.status(400).send({ error: 'No such operation exists' });
      return;
    }

    const student = await Student.findOne({
      where: {
        classId: req.ownerClass!.id,
        username: req.user!.username,
      },
    });

    if (
      req.user!.username !== req.ownerClass!.ownerRef
      && req.user!.username !== student?.username
    ) {
      res.status(400).send({ error: 'No such operation exists' });
      return;
    }

    await Blurred.create({
      username: req.user!.username,
      quizId: quizExists.quizId,
    });

    res.sendStatus(200);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const requested = req.query.return as unknown as string | undefined;
    const fields = requested ? requested.split(',') : ['live', 'expired'];
    const now = new Date();

    const classRequested = await Class.findOne({
      where: {
        ownerRef: req.user!.username,
        id: req.params.classId,
      },
      attributes: ['ownerRef', 'id'],
    });

    const response: {
      [fields: string]: Quiz[]
    } = { live: [], expired: [], scored: [] };

    if (fields.includes('live')) {
      if (!classRequested) {
        response.live = await Quiz.findAll({
          where: {
            timePeriod: {
              [Op.contains]: now,
            },
            classId: req.params.classId,
          },
          order: [['createdAt', 'DESC']],
          attributes: ['classId', 'quizId', 'title', 'description', 'timePeriod', 'releaseScore', 'allowBlur'],
        });
      } else {
        response.live = await Quiz.findAll({
          where: {
            [Op.and]: [
              Sequelize.where(Sequelize.fn('upper', Sequelize.col('timePeriod')), {
                [Op.gt]: now,
              }),
            ],
            classId: req.params.classId,
          },
          order: [['createdAt', 'DESC']],
          attributes: ['classId', 'quizId', 'title', 'description', 'timePeriod', 'releaseScore', 'allowBlur'],
        });
      }
    }

    if (fields.includes('expired')) {
      response.expired = await Quiz.findAll({
        where: {
          [Op.and]: [
            Sequelize.where(Sequelize.fn('upper', Sequelize.col('timePeriod')), {
              [Op.lt]: now,
            }),
          ],
          classId: req.params.classId,
        },
        order: [['createdAt', 'DESC']],
        attributes: ['classId', 'quizId', 'title', 'description', 'timePeriod', 'releaseScore', 'allowBlur'],
      });
    }

    if (fields.includes('scored')) {
      response.scored = await Quiz.findAll({
        where: {
          releaseScore: true,
          classId: req.params.classId,
          '$result.responder$': req.user!.username,
        },
        order: [['createdAt', 'DESC']],
        attributes: ['classId', 'quizId', 'title', 'description', 'timePeriod', 'releaseScore', 'allowBlur'],
        include: [
          {
            model: Result,
            as: 'result',
            required: true,
          },
        ],
      });
    }

    res.send(response);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId/:quizId', auth, mustBeClassOwner, async (req, res) => {
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

    res.send(quiz);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/que/:classId/:quizId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: {
        classId: req.params.classId,
        quizId: req.params.quizId,
      },
    });

    if (!quiz) {
      res.status(404).send({ error: 'No such quiz found' });
      return;
    }

    const now = new Date().getTime();

    if (quiz.timePeriod[0].value.getTime() > now || quiz.timePeriod[1].value.getTime() < now) {
      res.status(400).send({ error: 'No longer accepting response' });
      return;
    }

    if (!quiz.allowBlur) {
      const blurExists = await Blurred.findOne({
        where: {
          username: req.user!.username,
          quizId: quiz.quizId,
        },
      });

      if (blurExists) {
        res.status(400).send({ error: 'You cannot submit the test now' });
        return;
      }
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

    if (!quiz.multipleSubmit) {
      const hasSubmitted = await Result.findOne({
        where: {
          responder: req.user!.username,
          quizId: req.params.quizId,
        },
      });

      if (hasSubmitted) {
        res.status(400).send({ error: 'You have already responded' });
        return;
      }
    }

    const totalScore = questions.length === 0
      ? 0 : questions.map((que) => que.score).reduce((a, b) => a + b);

    if (quiz.randomOp) {
      questions.forEach((que) => shuffleArray<string>(que.options));
    }

    res.send({
      questions, totalScore, quizId: quiz.quizId, quizTitle: quiz.title, allowBlur: quiz.allowBlur,
    });
  } catch (e) {
    SendOnError(e, res);
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
      res.status(404).send({ error: 'No such quiz found' });
      return;
    }

    const now = new Date().getTime();

    if (quiz.timePeriod[0].value.getTime() > now || quiz.timePeriod[1].value.getTime() < now) {
      res.status(400).send({ error: 'No longer accepting response' });
      return;
    }

    if (!quiz.multipleSubmit) {
      const hasSubmitted = await Result.findOne({
        where: {
          responder: req.user!.username,
          quizId: req.params.quizId,
        },
      });

      if (hasSubmitted) {
        res.status(400).send({ error: 'You have already responded' });
        return;
      }
    }

    if (!quiz.allowBlur) {
      const blurExists = await Blurred.findOne({
        where: {
          username: req.user!.username,
          quizId: quiz.quizId,
        },
      });

      if (blurExists) {
        res.status(400).send({ error: 'You cannot submit the test now' });
        return;
      }
    }

    await Result.create({
      quizId: req.params.quizId,
      responder: req.user!.username,
      response: req.body.response,
    });

    res.send({ releaseScore: quiz.releaseScore });
  } catch (e) {
    SendOnError(e, res);
  }
});

router.put('/:classId/:quizId', auth, mustBeClassOwner, async (req, res) => {
  const queries = Object.keys(req.body);
  const allowedQueries = ['questions', 'title', 'description', 'timePeriod', 'releaseScore', 'randomOp', 'randomQue', 'multipleSubmit', 'allowBlur'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.status(400).send({ error: 'Bad request parameters' });
  }
  try {
    const range = req.body.timePeriod ? [
      { value: req.body.timePeriod[0], inclusive: true },
      { value: req.body.timePeriod[1], inclusive: true },
    ] : null;

    const updatedQuiz = await Quiz.update({
      ...req.body,
      timePeriod: range,
    }, {
      where: {
        classId: req.params.classId,
        quizId: req.params.quizId,
      },
      returning: true,
    });

    return res.send(updatedQuiz[1][0]);
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.delete('/:classId/:quizId', auth, mustBeClassOwner, async (req, res) => {
  const t = await sequelize.transaction();
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

    await Quiz.destroy({
      where: {
        classId: req.params.classId,
        quizId: req.params.quizId,
      },
      transaction: t,
    });

    await Question.destroy({
      where: {
        quizId: req.params.quizId,
      },
      transaction: t,
    });

    await Result.destroy({
      where: {
        quizId: req.params.quizId,
      },
      transaction: t,
    });

    await t.commit();
    res.send();
  } catch (e) {
    await t.rollback();
    SendOnError(e, res);
  }
});

export default router;
