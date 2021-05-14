import express from 'express';
import BusBoy from 'busboy';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import ffmpeg from 'fluent-ffmpeg';
import meter from 'stream-meter';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth, checkOnlyToken } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import { videoExtPattern } from '../utils/regexPatterns';
import { previewFilePath, modulePath } from '../utils/paths';
import { FileStorage } from '../services/FileStorage';

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
    const m = meter();

    busboy.on('file', (_fieldname, file, filename) => {
      if (filename.match(videoExtPattern)) {
        const filenameToSave = `${nanoid()}${path.extname(filename)}`;
        const saveTo = `${modulePath}/${filenameToSave}`;
        const stream = fs.createWriteStream(saveTo);
        file.pipe(m).pipe(stream).on('finish', () => {
          console.log(m.bytes);
          console.log(m.bytes / (1024 * 1024));
        });

        const previewFileName = `${nanoid()}.png`;
        ffmpeg(saveTo).takeScreenshots({
          count: 1,
          timemarks: ['1'],
          filename: previewFileName,
        }, previewFilePath);

        data.filename = filenameToSave;
        data.preview = previewFileName;

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
      data.moduleId = req.params.moduleId;
      const createdFile = await File.create(data);
      File.mp4ToHls480p(`${modulePath}/${createdFile.filename}`, createdFile.id);
      res.setHeader('Connection', 'close');
      return res.send(createdFile);
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

    const deleteFile = await File.destroy({
      where: {
        id: req.params.fileId,
        moduleId: req.params.moduleId,
      },
    });

    if (!deleteFile) {
      throw new Error();
    }

    await Promise.all([
      FileStorage.deleteFile(file.filename, modulePath),
      FileStorage.deleteFile(file.preview!, previewFilePath),
    ]);

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
