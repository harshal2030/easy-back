import express, { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { nanoid } from 'nanoid';

import { User } from '../models/User';

import { auth } from '../middlewares/auth';

import { SendOnError } from '../utils/functions';
import { avatarPath } from '../utils/paths';

const router = express.Router();

interface SignUpReq extends Request {
  body: {
    user: {
      name: string;
      username: string;
      email: string;
      password: string;
    }
  }
}

interface LoginReq extends Request {
  body: {
    user: {
      username: string;
      password: string;
    }
  }
}

router.post('/create', async (req: SignUpReq, res: Response) => {
  const queries = Object.keys(req.body.user);
  const allowedQueries = ['name', 'username', 'email', 'password'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.send({ error: 'Bad request parameters' });
  }
  try {
    const user = await User.create(req.body.user);
    const token = await user.generateJwt();

    return res.status(201).send({ user, token });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.post('/login', async (req: LoginReq, res: Response) => {
  try {
    const user = await User.checkUsernameAndPass(req.body.user.username, req.body.user.password);
    const token = await user.generateJwt();

    res.send({ user, token });
  } catch (e) {
    res.status(404).send();
  }
});

router.get('/token', auth, async (req, res) => {
  try {
    res.send(req.user!);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.post('/logout', auth, async (req, res) => {
  try {
    req.user!.tokens.filter((value) => value !== req.token!);

    await User.update({
      tokens: req.user!.tokens,
    }, {
      where: {
        username: req.user!.username,
      },
    });

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

const upload = multer({
  limits: {
    fileSize: 5 * 1000000,
  },
  fileFilter(_req, file, cb) {
    if (!file.originalname.match(/\.(png|jpeg|jpg)$/i)) {
      return cb(Error('Unsupported files uploaded to server'));
    }

    return cb(null, true);
  },
});

const mediaMiddleware = upload.fields([
  { name: 'avatar', maxCount: 1 },
]);

router.put('/', auth, mediaMiddleware, async (req, res) => {
  const data = JSON.parse(req.body.info);
  const queries = Object.keys(data);
  const allowedQueries = ['name'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid params.' });
  }

  try {
    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
    let fileName = '';
    if (files.avatar !== undefined) {
      const { buffer } = files.classPhoto[0];

      fileName = `${nanoid()}.png`;
      await sharp(buffer).png({ compressionLevel: 6 }).toFile(`${avatarPath}/${fileName}`);
      data.avatar = fileName;
    }

    const userToUpdate = await User.update(data, {
      where: {
        username: req.user!.username,
      },
      returning: true,
    });

    return res.send({ user: userToUpdate[1][0] });
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
