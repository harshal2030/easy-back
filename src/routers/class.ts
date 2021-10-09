import express, { Request, Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { Op } from 'sequelize';

import { Class } from '../models/Class';
import { User } from '../models/User';
import { Student } from '../models/Student';
import sequelize from '../db';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { FileStorage } from '../services/FileStorage';
import { SendOnError } from '../utils/functions';
import { classImagePath } from '../utils/paths';
import { oneMonthDiff } from '../utils/plans';
import { AllowedPeople } from '../models/AllowedPeople';

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
  const allowedQueries = ['name', 'about', 'subject', 'lockJoin', 'type'];
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

    const classCreated = await Class.create({
      ...data, ownerRef: req.user!.username, photo: fileName, lockMsg: true,
    });

    const {
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
      storageUsed,
      type,
      lockMsg,
    } = classCreated;

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
      type,
      lockMsg,
      storageUsed: parseInt(storageUsed, 10),
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
    const classes = await Class.getUserClasses(req.user!.username);

    res.send(classes);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const class2 = await Class.findOne({
      where: {
        id: req.params.classId,
      },
      attributes: ['id', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode', 'lockJoin', 'payedOn', 'planId', 'payId', 'storageUsed', 'lockMsg'],
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
      attributes: ['id', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode', 'lockJoin', 'payedOn', 'planId', 'payId', 'storageUsed'],
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

    if (studentsInClass >= 500) {
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

    const alreadyJoined = await Student.findOne({
      where: {
        username: req.user!.username,
        classId: classToJoin.id,
      },
    });

    if (alreadyJoined) {
      res.status(400).send();
      return;
    }

    if (classToJoin.hasSheet) {
      const isPresent = await AllowedPeople.findOne({
        where: {
          classId: classToJoin.id,
          email: req.user!.email,
        },
      });

      if (!isPresent) {
        res.status(400).send({ error: 'You cannot join this class' });
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
  const allowedQueries = ['name', 'about', 'subject', 'lockJoin', 'lockMsg'];
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
      id,
      name,
      about,
      photo,
      collaborators,
      subject,
      joinCode,
      lockJoin,
      payId,
      planId,
      payedOn,
      storageUsed,
      lockMsg,
      type,
    } = classToUpdate[1][0];

    return res.send({
      id,
      name,
      about,
      payId,
      payedOn,
      planId,
      type,
      photo,
      collaborators,
      subject,
      joinCode,
      lockJoin,
      lockMsg,
      owner: {
        username: req.user!.username,
        avatar: req.user!.avatar,
        name: req.user!.name,
      },
      storageUsed: parseInt(storageUsed, 10),
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (req.ownerClass!.name !== req.body.class) {
      res.status(400).send({ error: 'Unable to find requested resource' });
      return;
    }

    const user = await User.findOne({
      where: {
        [Op.or]: {
          username: req.body.user,
          email: req.body.user,
        },
      },
    });

    if (!user) {
      res.status(400).send({ error: 'Unable to find requested resource' });
      return;
    }

    const classToUpdate = await Class.update({
      ownerRef: req.body.user,
    }, {
      where: {
        id: req.params.classId,
      },
      returning: true,
      limit: 1,
      transaction: t,
    });

    await Student.destroy({
      where: {
        username: req.body.user,
        classId: req.params.classId,
      },
      limit: 1,
      transaction: t,
    });

    await t.commit();

    res.send(classToUpdate[1][0].id);
  } catch (e) {
    await t.rollback();
    SendOnError(e, res);
  }
});

export default router;
