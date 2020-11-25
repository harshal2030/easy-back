import express from 'express';

import { Announcement } from '../models/Announcement';
import { User } from '../models/User';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const message = await Announcement.create({
      message: req.body.message,
      author: req.user!.username,
      classId: req.params.classId,
    });

    res.send(message);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const offset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;
    const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 20;

    const msgs = await Announcement.findAll({
      where: {
        classId: req.params.classId,
      },
      offset,
      limit,
      include: [
        {
          model: User,
          as: 'user',
          required: true,
          attributes: ['username', 'name', 'avatar'],
        },
      ],
      attributes: ['createdAt', 'message', 'id'],
    });

    res.send(msgs);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
