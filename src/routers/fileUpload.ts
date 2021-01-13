import express from 'express';
import BusBoy from 'busboy';
import path from 'path';
import fs from 'fs';

import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId/:moduleId', async (req, res) => {
  try {
    const busboy = new BusBoy({ headers: req.headers });

    busboy.on('file', (fieldname, file, filename, enconding, mimetype) => {
      console.log(filename, mimetype);
      file.on('data', (data) => {
        console.log(`File [${fieldname}] got ${data.length} bytes`);
      });
      file.on('end', () => {
        console.log(`File [${fieldname}] Finished`);
      });

      const saveTo = path.join(__dirname, `../../../media/class/videos/${filename}.mp4`);
      const stream = fs.createWriteStream(saveTo);
      file.pipe(stream);
    });

    busboy.on('field', (fieldname, value, ft, vlt, enconding, mimetype) => {
      console.log(fieldname, value);
    });

    busboy.on('finish', () => {
      res.writeHead(200, { Connection: 'close' });
      res.end();
    });

    return req.pipe(busboy);
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
