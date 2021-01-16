import express from 'express';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const module = await Module.create({
      title: req.body.title,
      classId: req.params.classId,
    });

    res.send(module);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.delete('/:classId/:moduleId', auth, mustBeClassOwner, async (req, res) => {
  try {
    await Module.destroy({
      where: {
        classId: req.params.classId,
        id: req.params.moduleId,
      },
      limit: 1,
    });

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

router.put('/:classId/:moduleId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const updatedModule = await Module.update({ title: req.body.title }, {
      where: {
        classId: req.params.classId,
        id: req.params.moduleId,
      },
      returning: true,
      limit: 1,
    });

    res.send(updatedModule[1][0]);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const modules = await Module.findAll({
      where: {
        classId: req.params.classId,
      },
      attributes: ['id', 'classId', 'title'],
      order: ['title'],
    });

    res.send(modules);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId/:moduleId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const files = await File.findAll({
      where: {
        moduleId: req.params.moduleId,
      },
      attributes: ['id', 'title', 'filename'],
      order: [['createdAt', 'DESC']],
    });

    res.send(files);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
