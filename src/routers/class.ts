import express, { Request, Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { Op } from 'sequelize';

import { Class } from '../models/Class';
import { User } from '../models/User';
import { Student } from '../models/Student';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { FileStorage } from '../services/FileStorage';
import { SendOnError } from '../utils/functions';
import { classImagePath } from '../utils/paths';
import { oneMonthDiff } from '../utils/plans';

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 5 * 1000000,
  },
  fileFilter(_req, file, cb) {
    if (!file.originalname.match(/\.(PNG|JPEG|JPG|png|jpeg|jpg)$/i)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'classPhoto', maxCount: 1 },
]);

router.post('/', auth, mediaMiddleware, async (req: Request, res: Response) => {
  const data = JSON.parse(req.body.info);
  const queries = Object.keys(data);
  const allowedQueries = ['name', 'about', 'subject', 'lockJoin'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid param sent' });
  }
  try {
    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
    let fileName = '';
    if (files.classPhoto !== undefined) {
      const { buffer } = files.classPhoto[0];

      fileName = `${nanoid()}.png`;
      await FileStorage.saveImageFromBuffer(buffer, fileName, classImagePath);
    }

    const section = await Class.create({ ...data, ownerRef: req.user!.username, photo: fileName });
    const {
      id, name, about, photo, collaborators, subject, joinCode, lockJoin, payId, payedOn, planId,
    } = section;
    return res.status(201).send({
      id,
      name,
      about,
      photo,
      collaborators,
      subject,
      joinCode,
      lockJoin,
      payId,
      payedOn,
      planId,
      owner: {
        username: req.user!.username,
        avatar: req.user!.avatar,
        name: req.user!.name,
      },
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: {
        [Op.or]: {
          ownerRef: req.user!.username,
          '$students.username$': req.user!.username,
        },
      },
      attributes: ['id', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode', 'lockJoin', 'payId', 'payedOn', 'planId'],
      include: [
        {
          model: User,
          as: 'owner',
          required: true,
          attributes: ['avatar', 'username', 'name'],
        },
        {
          model: Student,
          as: 'students',
          attributes: [],
          required: false,
        },
      ],
    });

    console.log(classes);

    res.send(classes);
  } catch (e) {
    console.log(e);
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const class2 = await Class.findOne({
      where: {
        id: req.params.classId,
      },
      attributes: ['id', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode', 'lockJoin', 'payedOn', 'planId', 'payId'],
      include: [{
        model: User,
        as: 'owner',
        required: true,
        attributes: ['username', 'avatar', 'name'],
      }],
    });

    res.send(class2);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.post('/join', auth, async (req, res) => {
  try {
    const classToJoin = await Class.findOne({
      where: {
        joinCode: req.body.joinCode,
        lockJoin: false,
        ownerRef: {
          [Op.ne]: req.user!.username,
        },
      },
      attributes: ['id', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode', 'lockJoin', 'payedOn', 'planId', 'payId'],
      include: [{
        model: User,
        as: 'owner',
        required: true,
        attributes: ['username', 'avatar', 'name'],
      }],
    });

    if (!classToJoin) {
      res.status(404).send({ error: 'No such class found' });
      return;
    }

    const studentsInClass = await Student.count({
      where: {
        classId: classToJoin.id,
      },
    });

    if (studentsInClass >= 100 && classToJoin.planId === 'free') {
      res.status(400).send({ error: 'Class seats quota limit reached' });
      return;
    }

    if (studentsInClass >= 1000) {
      if (!classToJoin.payedOn) {
        res.status(400).send({ error: 'Class seats quota limit reached' });
        return;
      }

      const timePassed = new Date().getTime() - classToJoin.payedOn.getTime();

      if (timePassed > oneMonthDiff) {
        res.status(400).send({ error: 'Class seats quota limit reached' });
        return;
      }
    }

    await Student.create({
      classId: classToJoin.id,
      username: req.user!.username,
    });

    res.send(classToJoin);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.put('/:classId', auth, mustBeClassOwner, mediaMiddleware, async (req, res) => {
  const data = JSON.parse(req.body.info);
  const queries = Object.keys(data);
  const allowedQueries = ['name', 'about', 'subject', 'lockJoin'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid params.' });
  }
  try {
    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
    let fileName = '';
    if (files.classPhoto !== undefined) {
      const { buffer } = files.classPhoto[0];

      fileName = `${nanoid()}.png`;
      await FileStorage.saveImageFromBuffer(buffer, fileName, classImagePath);
      data.photo = fileName;

      if (req.ownerClass!.photo) {
        FileStorage.deleteFile(req.ownerClass!.photo, classImagePath);
      }
    }

    const classToUpdate = await Class.update({ ...data }, {
      where: {
        id: req.params.classId,
      },
      returning: true,
    });

    const {
      id, name, about, photo, collaborators, subject, joinCode, lockJoin, payId, planId, payedOn,
    } = classToUpdate[1][0];

    return res.send({
      id,
      name,
      about,
      payId,
      payedOn,
      planId,
      photo,
      collaborators,
      subject,
      joinCode,
      lockJoin,
      owner: {
        username: req.user!.username,
        avatar: req.user!.avatar,
        name: req.user!.name,
      },
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
