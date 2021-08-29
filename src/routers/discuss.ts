import express from 'express';

import { User } from '../models/User';
import { Discuss } from '../models/Discuss';
import sequelize from '../db';

import { auth } from '../middlewares/auth';
import { mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const discuss = await Discuss.create({
      author: req.user!.username,
      classId: req.params.classId,
      title: req.body.title,
    });

    const {
      id, classId, author, title, createdAt,
    } = discuss;

    req.io.to(req.params.classId).except(`${req.query.sid}`).emit('discuss', {
      type: 'discuss:new',
      payload: {
        id,
        comments: 0,
        classId,
        author,
        title,
        createdAt,
      },
    });

    res.send(discuss);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const discussions = await sequelize.query(`SELECT CASE WHEN count(m."id") > 30 THEN '30+' ELSE count(m."id")::VARCHAR END AS comments,
    d."id", d."classId", d."author", d."title", d."createdAt" FROM "Discusses" d LEFT JOIN "Messages" m ON d."id" = m."refId"
    WHERE "classId" = :classId GROUP BY d."id" ORDER BY d."createdAt" DESC;`, {
      replacements: {
        classId: req.params.classId,
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
    const discussion = await Discuss.findOne({
      where: {
        id: req.params.discussId,
        classId: req.params.classId,
      },
      attributes: { exclude: ['updatedAt', 'author'] },
      include: [{
        model: User,
        as: 'user',
        required: true,
        attributes: ['name', 'username', 'avatar'],
      }],
    });

    res.send(discussion);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
