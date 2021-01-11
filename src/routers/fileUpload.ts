import express from 'express';
import multer from 'multer';

const router = express.Router();

const upload = multer({
  limits: {
    fieldSize: 5 * 1024 * 1000_000,
  },
  fileFilter(_req, file, cb) {
    if (!file.originalname.match(/\.(png|jpeg|jpg|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i)) {
      return cb(Error('unsupported'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'file', maxCount: 10 },
]);

router.post('/', mediaMiddleware, async (_req, res) => {
  res.send('to be continued');
});
