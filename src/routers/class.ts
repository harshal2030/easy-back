import express, { Request, Response, Express } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

import { SendOnError } from '../utils/functions';
import { classImagePath } from '../utils/paths';

import { Class } from '../models/Class';
import { User } from '../models/User';
import { Student } from '../models/Student';
import sequelize from '../db';

import { auth } from '../middlewares/auth';

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 5 * 1000000,
  },
  fileFilter(_req, file, cb) {
    if (!file.originalname.match(/\.(PNG|JPEG|JPG|png|jpeg|jpg)$/)) {
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
  const allowedQueries = ['name', 'about', 'subject'];
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
      await sharp(buffer).png({ compressionLevel: 6 }).toFile(`${classImagePath}/${fileName}`);
    }

    const section = await Class.create({ ...data, owner: req.user!.username, photo: fileName });
    const {
      id, owner, name, about, photo, collaborators, subject, joinCode,
    } = section;
    return res.status(201).send({
      id,
      owner,
      name,
      about,
      photo,
      collaborators,
      subject,
      joinCode,
      ownerRef: {
        username: req.user!.username,
        avatar: req.user!.avatar,
      },
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const classes = await sequelize.query(`SELECT "Classes"."id", "Classes"."owner", "Classes"."name", "Classes"."about",
    "ownerRef"."avatar" AS "ownerRef.avatar", "ownerRef"."username" AS "ownerRef.username",
    "Classes"."photo", "Classes"."collaborators", "Classes"."subject", "Classes"."joinCode" FROM "Classes" LEFT JOIN "Students" 
    ON "Students"."classId" = "Classes"."id" INNER JOIN "Users" AS "ownerRef" ON "ownerRef"."username" = "Classes"."owner"
    WHERE "Classes"."owner" = :username OR "Students"."username" = :username ORDER BY "Classes"."createdAt" DESC`, {
      replacements: { username: req.user!.username },
    });

    res.send(classes[0].map((cls) => {
      const {
        // @ts-ignore
        id, owner, name, about, photo, collaborators, subject, joinCode,
      } = cls;
      return {
        id,
        owner,
        name,
        about,
        photo,
        collaborators,
        subject,
        joinCode,
        ownerRef: {
          // @ts-ignore
          username: cls['ownerRef.username'],
          // @ts-ignore
          avatar: cls['ownerRef.avatar'],
        },
      };
    }));
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const class2 = await Class.findOne({
      where: {
        id: req.params.id,
      },
      attributes: ['id', 'owner', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode'],
      include: [{
        model: User,
        as: 'ownerRef',
        required: true,
        attributes: ['username', 'avatar'],
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
      },
      attributes: ['id', 'owner', 'name', 'about', 'photo', 'collaborators', 'subject', 'joinCode'],
      include: [{
        model: User,
        as: 'ownerRef',
        required: true,
        attributes: ['username', 'avatar'],
      }],
    });

    if (!classToJoin) {
      return res.status(404).send({ error: 'No such class found' });
    }

    await Student.create({
      classId: classToJoin.id,
      username: req.user!.username,
    });

    return res.send(classToJoin);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
