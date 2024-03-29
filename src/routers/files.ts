import express from 'express';
import BusBoy from 'busboy';
import path from 'path';
import fs from 'fs';
import meter from 'stream-meter';
import { nanoid } from 'nanoid';
import ffmpeg from 'fluent-ffmpeg';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import mime from 'mime-types';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { premiumService } from '../middlewares/premium';

import { FileStorage } from '../services/FileStorage';

import { SendOnError } from '../utils/functions';
import {
  pdfExtPattern, videoExtPattern, videoExtPOSIX, pdfExtPOSIX,
} from '../utils/regexPatterns';
import { previewFilePath, modulePath } from '../utils/paths';
import { plans } from '../utils/plans';

const router = express.Router();

router.post('/:classId/:moduleId', auth, mustBeClassOwner, premiumService, async (req, res) => {
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

    if (req.ownerClass!.planId === 'free') {
      res.status(400).send({ error: 'Upgrade your class to access storage' });
    }

    const busboy = new BusBoy({
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 5 GB upload limit
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
        file.pipe(m).pipe(stream).on('finish', async () => {
          if (m.bytes > (plans.standard.storage - parseInt(req.ownerClass!.storageUsed, 10))) {
            errored = true;
            FileStorage.deleteFileFromPath(saveTo);
            return;
          }

          const previewName = `${nanoid()}.png`;

          ffmpeg(saveTo).takeScreenshots({
            timemarks: [1],
            count: 1,
            filename: previewName,
          }, previewFilePath);

          await File.onSuccessProcessVideo({
            moduleId: req.params.moduleId,
            title: data.title,
            filename: filenameToSave,
            preview: previewName,
            fileSize: m.bytes,
          }, req.params.classId);
        });

        file.on('error', () => {
          fs.unlink(saveTo, () => null);
          errored = true;
        });
      } else if (filename.match(pdfExtPattern)) {
        const filenameToSave = `${nanoid()}${path.extname(filename)}`;
        const filePath = `${modulePath}/${filenameToSave}`;
        const stream = fs.createWriteStream(filePath);

        file.pipe(m).pipe(stream).on('finish', async () => {
          if (m.bytes > (plans.standard.storage - parseInt(req.ownerClass!.storageUsed, 10))) {
            errored = true;
            FileStorage.deleteFileFromPath(filePath);
            return;
          }

          try {
            await File.create({
              moduleId: req.params.moduleId,
              filename: filenameToSave,
              fileSize: m.bytes,
              title: data.title,
            });
          } catch (e) {
            errored = true;
            FileStorage.deleteFileFromPath(filePath);
          }
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
        return res.status(400).send({ error: 'Unable to upload file' });
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
    const type = typeof req.query.t === 'string' ? req.query.t : 'video';

    const POSIX = type === 'video' ? videoExtPOSIX : pdfExtPOSIX;

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
        filename: {
          [Op.iRegexp]: POSIX,
        },
      },
      attributes: { exclude: ['updatedAt'] },
      order: [['createdAt', 'DESC']],
    });

    res.send(files);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/cookie/:classId/:moduleId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const module = await Module.findOne({
      where: {
        classId: req.params.classId,
        id: req.params.moduleId,
      },
    });

    if (!module) {
      res.status(404).send({ error: 'No such resource sound' });
      return;
    }

    const token = jwt.sign({ c: module!.classId, m: module.id }, process.env.cookieSecret!);

    res.cookie(
      'pass', token, { signed: true, sameSite: 'none', secure: process.env.NODE_ENV === 'production' },
    ).send(module.id);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/preview/:classId/:previewFile', async (req, res) => {
  try {
    res.sendFile(`${previewFilePath}/${req.params.previewFile}`);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId/:moduleId/:fileName', async (req, res) => {
  try {
    const filePath = path.join(__dirname, '../../../media/class/modules', req.params.fileName);
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const { range } = req.headers;

    if (range && req.params.fileName.match(videoExtPattern)) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send({ error: 'Requested range not satisfiable' });
        return;
      }

      const chunkSize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Range': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'video/mp4',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mime.contentType(path.extname(req.params.fileName)) as string,
      };

      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
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
