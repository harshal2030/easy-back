import express from 'express';

import { Announcement } from '../models/Announcement';
import { User } from '../models/User';

import { Notification } from '../services/Notification';
import { auth } from '../middlewares/auth';
import { mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    if (req.ownerClass?.lockMsg && req.ownerClass.ownerRef !== req.user?.username) {
      res.status(401).send({ error: 'forbidden to use this resource' });
      return;
    }

    const message = await Announcement.create({
      message: req.body.message,
      author: req.user!.username,
      classId: req.params.classId,
    });

    Notification.sendMsgToAllClassMember(req.params.classId, `${req.user!.username} made a Announcement`, message.message, {
      message: message.message,
      name: req.user!.name,
      username: req.user!.username,
      avatar: req.user!.avatar,
      id: message.id,
      classId: message.classId,
      createdAt: message.createdAt.toString(),
    });

    req.io.to(message.classId).emit('message', {
      type: 'message',
      payload: {
        message: message.message,
        user: {
          name: req.user!.name,
          username: req.user!.username,
          avatar: req.user!.avatar,
        },
        id: message.id,
        createdAt: message.createdAt,
        classId: message.classId,
      },
    });

    res.send({
      message: message.message,
      user: {
        name: req.user!.name,
        username: req.user!.username,
        avatar: req.user!.avatar,
      },
      id: message.id,
      createdAt: message.createdAt,
    });
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const msgs = await Announcement.findAll({
      where: {
        classId: req.params.classId,
      },
      include: [
        {
          model: User,
          as: 'user',
          required: true,
          attributes: ['username', 'name', 'avatar'],
        },
      ],
      attributes: ['createdAt', 'message', 'id'],
      order: [['createdAt', 'DESC']],
    });

    res.send(msgs);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
