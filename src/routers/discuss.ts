import express from 'express';

import { Discuss } from '../models/Discuss';

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

    req.io.to(req.params.classId).except(`${req.query.sid}`).emit('discuss:new', { type: 'discuss', payload: discuss });

    res.send(discuss);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId');
