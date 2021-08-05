import express from 'express';
import { Op } from 'sequelize';

import { Announcement } from '../models/Announcement';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { Unread } from '../models/Unread';
import sequelize from '../db';

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

    Notification.sendMsgToAllClassMember(req.params.classId, req.ownerClass!.ownerRef, `${req.user!.username} made a Announcement`, message.message, {
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

    Unread.updateUnread(req.user!.username, req.ownerClass!.id, new Date());

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

router.delete('/:classId/:msgId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const isOwner = req.user!.username === req.ownerClass!.ownerRef;
    const destroyOptions = isOwner ? {
      id: req.params.msgId, classId: req.params.classId,
    } : { id: req.params.msgId, classId: req.params.classId, author: req.user!.username };

    const destroyedMsg = await Announcement.destroy({ where: destroyOptions });

    if (!destroyedMsg) {
      res.status(400).send({ error: 'No such resource' });
      return;
    }

    req.io.to(req.params.classId).emit('message:delete', {
      type: 'message:delete',
      payload: {
        classId: req.params.classId,
        msgId: req.params.msgId,
      },
    });
    res.send(req.params.msgId);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/unread', auth, async (req, res) => {
  try {
    const classes = await Class.getUserClasses(req.user!.username);
    const classIds = classes.map((cls) => cls.id);

    const unreads = await sequelize.query(`SELECT COUNT(u.id) unreads, "classId" FROM "Unreads" u INNER JOIN "Announcements" a USING ("classId")
    WHERE u."lastMessageRead" < a."createdAt" AND username=:username AND "classId" IN (:classIds)
    GROUP BY "classId";`, {
      replacements: {
        classIds,
        username: req.user!.username,
      },
      raw: true,
      nest: true,
    }) as unknown as {classId: string; unreads: number}[];

    const dataToSend: {[classId: string]: {classId: string; unread: number}} = {};

    unreads.forEach((un: {classId: string; unreads: number}) => {
      dataToSend[un.classId] = {
        unread: un.unreads,
        classId: un.classId,
      };
    });

    res.send(dataToSend);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.post('/unread/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    await Unread.updateUnread(req.user!.username, req.ownerClass!.id, req.body.lastMessageDate);

    res.sendStatus(200);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const after = typeof req.query.after === 'string' ? req.query.after : null;

    const afterMessage = after ? await Announcement.findOne({
      where: {
        id: after,
      },
    }) : null;

    const where = afterMessage ? {
      classId: req.params.classId,
      createdAt: {
        [Op.lt]: afterMessage.createdAt,
      },
    } : { classId: req.params.classId };

    const msgs = await Announcement.findAll({
      where,
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
      limit: 10,
    });

    res.send(msgs);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
