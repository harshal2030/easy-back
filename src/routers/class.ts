import express, { Request, Response, Express } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

import { SendOnError } from '../utils/functions';
import { classImagePath } from '../utils/paths';

import { Class } from '../models/Class';
import sequelize from '../db';

import { auth } from '../middlewares/auth';
import { Student } from '../models/Student';

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
    const { buffer } = files.classPhoto[0];

    const fileName = `${nanoid()}.png`;
    await sharp(buffer).png({ compressionLevel: 6 }).toFile(`${classImagePath}/${fileName}`);

    const section = await Class.create({ ...data, owner: req.user!.username, photo: fileName });

    return res.status(201).send(section);
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const classes = await sequelize.query(`SELECT "Classes"."id", "Classes"."owner", "Classes"."name", "Classes"."about", "Users"."avatar",
    "Classes"."photo", "Classes"."collaborators" FROM "Classes" LEFT JOIN "Students" 
    ON "Students"."classId" = "Classes"."id" INNER JOIN "Users" ON "Users"."username" = "Classes"."owner"
    WHERE "Classes"."owner" = :username OR "Students"."username" = :username`, {
      replacements: { username: req.user!.username },
    });

    res.send(classes[0]);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const section = await Class.findOne({
      where: {
        id: req.params.id,
      },
      raw: true,
    });

    res.send(section);
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
    });

    if (!classToJoin) {
      return res.status(404).send({ error: 'No such class found' });
    }

    await Student.create({
      classId: classToJoin.id,
      username: req.user!.username,
    });

    return res.send();
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
