import express from 'express';

import { Student } from '../models/Student';
import { User } from '../models/User';

import { auth } from '../middlewares/auth';
import { mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const offset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;

    const students = await Student.findAll({
      where: {
        classId: req.params.classId,
      },
      attributes: [],
      order: [[{ model: User, as: 'student' }, 'name']],
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'avatar', 'username'],
          required: true,
        },
      ],
      offset,
      limit: 10,
    });

    res.send(students.map((ppl) => ({
      name: ppl.student!.name,
      username: ppl.student!.username,
      avatar: ppl.student!.avatar,
    })));
  } catch (e) {
    SendOnError(e, res);
  }
});

router.delete('/:username/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const unEnrolled = await Student.destroy({
      where: {
        classId: req.params.classId,
        username: req.params.username,
      },
    });

    if (!unEnrolled) {
      throw new Error();
    }

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
