import express from 'express';
import XLSX from 'xlsx';
import multer from 'multer';

import { Student } from '../models/Student';
import { User } from '../models/User';
import { Class } from '../models/Class';
import { AllowedPeople } from '../models/AllowedPeople';
import sequelize from '../db';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';
import { premiumService } from '../middlewares/premium';

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 50 * 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(xlsx|xls)$/i)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'sheet', maxCount: 1 },
]);

router.post('/:classId', auth, mustBeClassOwner, premiumService, mediaMiddleware, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    await AllowedPeople.destroy({
      where: {
        classId: req.params.classId,
      },
      transaction: t,
    });

    const files = req.files as unknown as { sheet: Express.Multer.File[] };
    const workbook = XLSX.read(files.sheet[0].buffer);
    const sheets = workbook.SheetNames;
    const queData = XLSX.utils.sheet_to_json<{email: string}>(workbook.Sheets[sheets[0]]);
    const dataToInsert = queData.map((d) => ({ classId: req.params.classId, email: d.email }));

    await AllowedPeople.bulkCreate(dataToInsert, { transaction: t });
    await Class.update({ hasSheet: true }, {
      where: {
        id: req.params.classId,
      },
    });
    await t.commit();

    res.sendStatus(200);
  } catch (e) {
    await t.rollback();
    SendOnError(e, res);
  }
});

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
