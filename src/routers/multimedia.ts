import express from 'express';
import path from 'path';

import { SendOnError } from '../utils/functions';
import { avatarPath, classImagePath } from '../utils/paths';

const router = express.Router();

router.get('/sample', async (_req, res) => {
  try {
    res.sendFile(path.join(__dirname, '../../sample.xlsx'));
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
