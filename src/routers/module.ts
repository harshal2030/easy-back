import express from 'express';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import {
  imageExtPattern, videoExtPattern, pptExtPattern, pdfExtPattern, docExtPattern, excelExtPattern,
} from '../utils/regexPatterns';

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
    });

    const responseObj: {[field: string]: File[]} = {
      image: [],
      video: [],
      doc: [],
      pdf: [],
      ppt: [],
      excel: [],
    };

    files.forEach((file) => {
      if (file.filename.match(imageExtPattern)) {
        responseObj.image.push(file);
      }

      if (file.filename.match(videoExtPattern)) {
        responseObj.video.push(file);
      }

      if (file.filename.match(pdfExtPattern)) {
        responseObj.pdf.push(file);
      }

      if (file.filename.match(docExtPattern)) {
        responseObj.doc.push(file);
      }

      if (file.filename.match(pptExtPattern)) {
        responseObj.doc.push(file);
      }

      if (file.filename.match(excelExtPattern)) {
        responseObj.excel.push(file);
      }
    });

    res.send(responseObj);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
