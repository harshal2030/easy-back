import express, { Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';

import { User } from '../models/User';
import { Message } from '../models/Messages';

import { auth } from '../middlewares/auth';
import { mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import { imageExtPattern } from '../utils/regexPatterns';
import { classImagePath } from '../utils/paths';
import { FileStorage } from '../services/FileStorage';

const router = express.Router();

type MessageRes = {
  id: string;
  message: string;
  user: {
    name: string;
    username: string;
    avatar: string;
  };
  createdAt: Date;
};

const upload = multer({
  limits: {
    fileSize: 50 * 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(imageExtPattern)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
]);

router.post('/:classId/:refId', auth, mustBeStudentOrOwner, mediaMiddleware, async (req, res: Response<MessageRes>) => {
  try {
    const info = JSON.parse(req.body.info);

    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };

    if (files.image !== undefined) {
      const filename = `${nanoid()}.png`;
      await FileStorage.saveImageFromBuffer(files.image[0].buffer, filename, classImagePath);
      info.file = filename;
    }

    const message = await Message.create({
      author: req.user!.username,
      refId: req.params.refId,
      message: info.message,
      file: info.file,
    });

    const resToSend = {
      id: message.id,
      message: message.message,
      file: message.file,
      user: {
        name: req.user!.name,
        username: req.user!.username,
        avatar: req.user!.avatar,
      },
      createdAt: message.createdAt,
    };

    req.io.to(req.params.classId).except(`${req.query.sid}`).emit(req.params.refId, { type: 'message', payload: resToSend });

    res.send(resToSend);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId/:refId', auth, mustBeStudentOrOwner, async (req, res) => {
  try { // TODO: fix security by checking ref
    const messages = await Message.findAll({
      where: {
        refId: req.params.refId,
      },
      include: [{
        model: User,
        as: 'user',
        required: true,
        attributes: ['name', 'username', 'avatar'],
      }],
      attributes: ['message', 'id', 'createdAt', 'file'],
      order: ['createdAt'],
    });

    res.send(messages);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
