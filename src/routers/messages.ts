import express from 'express';

import { User } from '../models/User';
import { Message } from '../models/Messages';

import { auth } from '../middlewares/auth';
import { mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId/:refId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const message = await Message.create({
      author: req.user!.username,
      refId: req.params.refId,
      message: req.body.message,
    });

    req.io.to(req.params.classId).except(`${req.query.sid}`).emit(req.params.refId, { type: 'message', message });

    res.send(message);
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
      order: [['createdAt', 'DESC']],
    });

    res.send(messages);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
