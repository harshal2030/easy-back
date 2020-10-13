import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

import { Question } from '../models/Questions';
import { Quiz } from '../models/Quiz';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';
import { classImagePath } from '../utils/paths';

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 50 * 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(PNG|JPEG|JPG|png|jpeg|jpg)$/)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'media', maxCount: 1 },
]);

// TODO: add attachment to question
router.post('/:classId/:quizId', auth, mustBeClassOwner, mediaMiddleware, async (req, res) => {
  const info = JSON.parse(req.body.info);

  if (info.queId || info.quizId || info.classId) {
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
    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };

    if (files.media !== undefined) {
      const filename = `${nanoid()}.png`;
      const filePath = `${classImagePath}/${filename}`;
      await sharp(files.media[0].buffer).png().toFile(filePath);
      info.attachments = filename;
    }

    const que = await Question.create({ ...info, quizId: req.params.quizId });

    return res.send(que);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
