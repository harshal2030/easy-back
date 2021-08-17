import express from 'express';
import { Op, literal } from 'sequelize';

import { Discuss } from '../models/Discuss';
import { Message } from '../models/Message';
import sequelize from '../db';

import { mustBeStudentOrOwner } from '../middlewares/userLevels';
import { auth } from '../middlewares/auth';

import { SendOnError } from '../utils/functions';
import { User } from '../models/User';

const router = express.Router();

router.post('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const discussion = await Discuss.create({
      author: req.user!.username,
      title: req.body.title,
      classId: req.params.classId,
      private: req.body.private || false,
    });

    req.io.to(req.ownerClass!.id).except(`${req.query.sid}`).emit('discuss:new', { discussion });

    res.send(discussion);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const discussions = await sequelize.query(`SELECT count(m."discussId") AS comments, d."title", d."id", d."author",
    d."closed", d."createdAt", d."closedPermanent"
    FROM "Discusses" d LEFT JOIN "Messages" m ON m."discussId" = d."id"
    WHERE d."classId"=:classId GROUP BY d."id";`, {
      replacements: {
        classId: req.ownerClass!.id,
      },
      nest: true,
      raw: true,
    });

    res.send(discussions);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId/:discussId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const discussInfo = await Discuss.findOne({
      where: {
        id: req.params.discussId,
        classId: req.params.classId,
      },
    });

    if (!discussInfo) {
      res.status(400).send({ error: 'No such resource' });
      return;
    }

    res.send(discussInfo);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/msg/:classId/:discussId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const after = typeof req.query.after === 'string' ? req.query.after : null;

    const afterMessage = after ? await Message.findOne({
      where: {
        discussId: req.params.discussId,
        id: after,
      },
    }) : null;

    const where = afterMessage ? {
      discussId: req.params.discussId,
      createdAt: {
        [Op.lt]: afterMessage.createdAt,
      },
    } : { discussId: req.params.discussId };

    const messages = await Message.findAll({
      where,
      limit: 20,
      attributes: [['id', '_id'], ['message', 'text'], 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          required: true,
          attributes: [[literal('"user"."username"'), '_id'], 'name', 'avatar'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.send(messages);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.post('/msg/:classId/:discussId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const discussExists = await Discuss.findOne({
      where: {
        classId: req.params.classId,
        id: req.params.discussId,
      },
    });

    if (!discussExists) {
      res.status(400).send({ error: 'No such resource found' });
      return;
    }

    const chat = await Message.create({
      discussId: discussExists.id,
      message: req.body.message,
      author: req.user!.username,
    });

    req.io.to(req.params.classId).except(`${req.query.sid}`).emit(chat.discussId, {
      text: chat.message,
      user: {
        _id: req.user!.username,
        name: req.user!.name,
        avatar: req.user!.avatar,
      },
      createdAt: chat.createdAt,
      _id: chat.id,
    });

    res.send(chat);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
