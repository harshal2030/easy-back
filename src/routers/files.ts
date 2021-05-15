import express from 'express';
import BusBoy from 'busboy';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth, checkOnlyToken } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import { videoExtPattern } from '../utils/regexPatterns';
import { previewFilePath, modulePath } from '../utils/paths';

const router = express.Router();

router.post('/:classId/:moduleId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const moduleExists = await Module.findOne({
      where: {
        id: req.params.moduleId,
        classId: req.params.classId,
      },
    });

    if (!moduleExists) {
      return res.status(404).send({ error: "Module doesn't exists" });
    }

    const busboy = new BusBoy({
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1000_000,
      },
    });

    let errored = false;

    // {moduleId: string; title: string; filename: string; preview: string}
    const data: {[fieldName: string]: string} = {};

    busboy.on('file', (_fieldname, file, filename) => {
      if (filename.match(videoExtPattern)) {
        const filenameToSave = `${nanoid()}${path.extname(filename)}`;
        const saveTo = `${modulePath}/${filenameToSave}`;
        const stream = fs.createWriteStream(saveTo);
        file.pipe(stream).on('finish', () => {
          File.processVideo({
            videoPath: saveTo,
            title: data.title,
            classId: req.params.classId,
            moduleId: req.params.moduleId,
          });
        });

        file.on('error', () => {
          fs.unlink(saveTo, () => null);
        });
      } else {
        errored = true;
      }
    });

    busboy.on('field', (fieldname, value) => {
      data[fieldname] = value as unknown as string;
    });

    busboy.on('finish', async () => {
      if (errored) {
        return res.status(400).send({ error: 'Check your file and check again' });
      }
      res.setHeader('Connection', 'close');
      return res.send();
    });

    return req.pipe(busboy);
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.get('/:classId/:moduleId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const module = await Module.findOne({
      where: {
        classId: req.params.classId,
        id: req.params.moduleId,
      },
    });

    if (!module) {
      throw new Error();
    }

    const files = await File.findAll({
      where: {
        moduleId: req.params.moduleId,
      },
      attributes: { exclude: ['updatedAt'] },
      order: [['createdAt', 'DESC']],
    });

    res.send(files);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.use('/:classId/:moduleId', checkOnlyToken, express.static(path.join(__dirname, '../../../media/class/hls')));

router.get('/preview/:classId/:previewFile', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    res.sendFile(`${previewFilePath}/${req.params.previewFile}`);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.delete('/:classId/:moduleId/:fileId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const moduleRef = Module.findOne({
      where: {
        classId: req.params.classId,
        id: req.params.moduleId,
      },
    });

    const fileRef = File.findOne({
      where: {
        id: req.params.fileId,
        moduleId: req.params.moduleId,
      },
    });

    const [module, file] = await Promise.all([moduleRef, fileRef]);

    if (!module) {
      throw new Error();
    }

    if (!file) {
      throw new Error();
    }

    await File.deleteFile(file, req.params.classId);

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
