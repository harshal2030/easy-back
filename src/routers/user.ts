import express, { Request, Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import BasicAuth from 'express-basic-auth';

import { User } from '../models/User';
import { Device } from '../models/Device';
import sequelize from '../db';

import { auth } from '../middlewares/auth';

import { SendOnError } from '../utils/functions';
import { avatarPath } from '../utils/paths';
import { FileStorage } from '../services/FileStorage';

const router = express.Router();

interface SignUpReq extends Request {
  body: {
    user: {
      name: string;
      username: string;
      email: string;
      password: string;
    };
    device?: {
      os: string;
      fcmToken: string;
    }
  }
}

interface LoginReq extends Request {
  body: {
    user: {
      username: string;
      password: string;
    };
    device? :{
      fcmToken: string;
      os: string;
    }
  }
}

const accountAuth = BasicAuth({
  users: {
    accountCreator: process.env.accPass!,
  },
});

router.post('/create', accountAuth, async (req: SignUpReq, res: Response) => {
  const queries = Object.keys(req.body.user);
  const allowedQueries = ['name', 'username', 'email', 'password'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.send({ error: 'Bad request parameters' });
  }
  try {
    const user = await User.create(req.body.user);
    const token = await user.generateJwt();

    if (req.body.device) {
      Device.create({
        ...req.body.device,
        username: req.body.user.username,
        token,
      });
    }

    return res.status(201).send({ user, token });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.post('/login', accountAuth, async (req: LoginReq, res: Response) => {
  try {
    const user = await User.checkUsernameAndPass(req.body.user.username, req.body.user.password);
    const token = await user.generateJwt();

    if (req.body.device) {
      Device.create({
        ...req.body.device,
        username: user.username,
        token,
      });
    }

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
  const t = await sequelize.transaction();
  try {
    const tokens = req.user!.tokens.filter((value) => value !== req.token!);

    const updated = await User.update({
      tokens,
    }, {
      where: {
        username: req.user!.username,
      },
      transaction: t,
    });

    if (!updated) {
      throw new Error();
    }

    const deletedDevices = await Device.destroy({
      where: {
        token: req.token!,
      },
      transaction: t,
    });

    if (!deletedDevices) {
      throw new Error();
    }

    await t.commit();

    res.send();
  } catch (e) {
    await t.rollback();
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
  const allowedQueries = ['name', 'username'];
  const isValid = queries.every((query) => allowedQueries.includes(query));

  if (!isValid) {
    return res.status(400).send({ error: 'Invalid params.' });
  }

  try {
    const files = req.files as unknown as { [fieldname: string]: Express.Multer.File[] };
    let fileName = '';

    if (files.avatar !== undefined) {
      const { buffer } = files.avatar[0];

      fileName = `${nanoid()}.png`;
      await FileStorage.saveImageFromBuffer(buffer, fileName, avatarPath);
      data.avatar = fileName;

      if (req.user!.avatar !== 'default.png') {
        FileStorage.deleteFile(req.user!.avatar, avatarPath);
      }
    }

    let token = req.token!;

    if (data.username) {
      const newTokens = User.generateJWTAndUpdateArray(data.username, token!, req.user!.tokens);

      token = newTokens.token;
      data.tokens = newTokens.tokens;
    }

    const userToUpdate = await User.update(data, {
      where: {
        username: req.user!.username,
      },
      returning: true,
    });

    return res.send({ user: userToUpdate[1][0], token });
  } catch (e) {
    return SendOnError(e, res);
  }
});

export default router;
