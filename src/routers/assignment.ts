import express from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'fs';

import { Assignment } from '../models/Assignment';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { FileStorage } from '../services/FileStorage';
import { SendOnError } from '../utils/functions';
import { classImagePath, classDocPath } from '../utils/paths';

const router = express.Router();

const upload = multer({
  limits: {
    fileSize: 40 * 1000000,
  },
  fileFilter(_req, file, cb) {
    if (!file.originalname.match(/\.(PNG|JPEG|JPG|png|jpeg|jpg|pdf|PDF)$/i)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
]);

router.post('/:classId', auth, mustBeClassOwner, mediaMiddleware, async (req, res) => {
  const data = JSON.parse(req.body.info);
  const queries = Object.keys(data);
  const allowedQueries = ['title', 'description', 'dueDate', 'allowLate'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    res.status(400).send({ error: 'Invalid param sent' });
    return;
  }
  try {
    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
    let fileName: string | null = null;

    if (files.image !== undefined) {
      fileName = `${nanoid()}.png`;
      await FileStorage.saveImageFromBuffer(files.image[0].buffer, fileName, classImagePath);
    }

    if (files.pdf !== undefined) {
      fileName = `${nanoid()}.pdf`;
      fs.writeFile(`${classDocPath}/${fileName}`, files.pdf[0].buffer, () => null);
    }

    const assignment = await Assignment.create({
      title: data.title,
      description: data.description,
      classId: req.ownerClass!.id,
      author: req.user!.username,
      dueDate: data.dueDate,
      allowLate: data.allowNull,
      file: fileName,
    });

    res.send(assignment);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: {
        classId: req.params.classId,
      },
      attributes: { exclude: ['updatedAt'] },
    });

    res.send(assignments);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.put('/:classId/:assignId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const {
      title, description, dueDate, allowLate,
    } = req.body;
    const assignment = await Assignment.update({
      title,
      description,
      allowLate,
      dueDate,
    }, {
      where: {
        classId: req.params.classId,
        id: req.params.assignId,
      },
      returning: true,
    });

    res.send(assignment[1][0]);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
