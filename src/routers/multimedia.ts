import express from 'express';

import { SendOnError } from '../utils/functions';
import { classImagePath } from '../utils/paths';

const router = express.Router();

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
