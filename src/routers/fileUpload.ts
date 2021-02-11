import express from 'express';
import BusBoy from 'busboy';
import path from 'path';
import fs from 'fs';
import mime from 'mime-types';
import { nanoid } from 'nanoid';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import { modulePath } from '../utils/paths';

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
      return res.status(400).send({ error: "Module doesn't exists" });
    }

    const busboy = new BusBoy({
      headers: req.headers,
      limits: {
        fileSize: 5 * 1024 * 1000_000,
      },
    });

    let errored = false;

    const data: {[fieldname: string]: string} = {};

    busboy.on('file', (_fieldname, file, filename) => {
      if (filename.match(/\.(png|jpeg|jpg|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|mp4|mkv|mov|wmv)$/i)) {
        const filenameToSave = `${nanoid()}${path.extname(filename)}`;
        const saveTo = path.join(__dirname, `../../../media/class/modules/${filenameToSave}`);
        const stream = fs.createWriteStream(saveTo);
        file.pipe(stream);

        data.filename = filenameToSave;
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
        res.status(400).send({ error: 'Check your file type or try again later' });
      }
      data.moduleId = req.params.moduleId;
      const createdFile = await File.create(data);
      res.setHeader('Connection', 'close');
      res.send(createdFile);
    });

    return req.pipe(busboy);
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.get('/:classId/:moduleId/:filename', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const filePath = `${modulePath}/${req.params.filename}`;
    if (!fs.existsSync(filePath)) {
      return res.sendStatus(404);
    }

    const stream = fs.createReadStream(filePath);
    res.setHeader('Content-disposition', `attachment; filename=${req.params.filename}`);
    res.setHeader('Content-Type', mime.contentType(req.params.filename) as string);
    res.setHeader('Connection', 'close');
    return stream.pipe(res);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
