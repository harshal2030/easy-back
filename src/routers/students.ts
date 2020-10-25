import express from 'express';

import { Student } from '../models/Student';
import { User } from '../models/User';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const students = await Student.findAll({
      where: {
        classId: req.params.classId,
      },
      attributes: [],
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['name', 'avatar', 'username'],
          required: true,
        },
      ],
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

router.delete('/:username/:classId', auth, mustBeClassOwner, async (req, res) => {
  try {
    await Student.destroy({
      where: {
        classId: req.params.classId,
        username: req.params.username,
      },
    });

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
