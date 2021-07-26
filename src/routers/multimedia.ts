import express from 'express';
import path from 'path';
import fs from 'fs';

import { SendOnError } from '../utils/functions';
import { avatarPath, classImagePath } from '../utils/paths';

const router = express.Router();

router.get('/sample', async (_req, res) => {
  try {
    res.setHeader('Content-disposition', 'attachment; filename=sample.xlsx');
    res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    const file = fs.createReadStream(path.join(__dirname, '../../sample.xlsx'));
    file.pipe(res);
  } catch (e) {
    res.status(500).send();
  }
});

router.get('/avatar/:filename', async (req, res) => {
  try {
    res.sendFile(`${avatarPath}/${req.params.filename}`);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/class/avatar', async (_req, res) => {
  try {
    res.sendFile(`${classImagePath}/default.png`);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/class/avatar/:filename', async (req, res) => {
  try {
    res.sendFile(`${classImagePath}/${req.params.filename}`);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/que/:filename', async (req, res) => {
  try {
    res.sendFile(`${classImagePath}/${req.params.filename}`);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
