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
import { videoExtPattern } from '../utils/regexPatterns';

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

    // {moduleId: string; title: string; filename: string}
    const data: {[fieldName: string]: string} = {};

    busboy.on('file', (_fieldname, file, filename) => {
      if (filename.match(videoExtPattern)) {
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
        return res.status(400).send({ error: 'Check your file and check again' });
      }
      data.moduleId = req.params.moduleId;
      const createdFile = await File.create(data);
      res.setHeader('Connection', 'close');
      return res.send(createdFile);
    });

    return req.pipe(busboy);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
