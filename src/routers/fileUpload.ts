import express from 'express';
import BusBoy from 'busboy';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';

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

    const data: {[fieldname: string]: string} = {};

    busboy.on('file', (_fieldname, file, filename) => {
      const filenameToSave = `${nanoid()}${path.extname(filename)}`;
      const saveTo = path.join(__dirname, `../../../media/class/modules/${filenameToSave}`);
      const stream = fs.createWriteStream(saveTo);
      file.pipe(stream);

      data.filename = filenameToSave;

      file.on('error', () => {
        fs.unlink(saveTo, () => null);
      });
    });

    busboy.on('field', (fieldname, value) => {
      data[fieldname] = value as unknown as string;
    });

    busboy.on('finish', async () => {
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

export default router;
