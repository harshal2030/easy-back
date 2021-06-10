import express, { Request, Response } from 'express';
import multer from 'multer';
import { nanoid } from 'nanoid';
import BasicAuth from 'express-basic-auth';
import crypto from 'crypto';

import { User } from '../models/User';
import { Device } from '../models/Device';
import { Student } from '../models/Student';
import { Result } from '../models/Result';
import { Announcement } from '../models/Announcement';
import { Recovery } from '../models/Recovery';
import { VideoTracker } from '../models/VideoTracker';
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
    // message have possible values: 'CONTINUE' | 'UPDATE_REQUIRED' | 'SERVER_MAINTENANCE'
    // this message are meant to be used in the front-end to force user for specific actions
    // CONTINUE: Let the user move forward to app
    // UPDATE_REQUIRED: force user to update app
    // SERVER_MAINTENANCE: don't let user access service.
    res.send({ user: req.user!, message: 'CONTINUE' });
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

router.post('/recover', accountAuth, async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        email: req.body.email,
      },
      attributes: ['email', 'username'],
    });

    if (!user) {
      return res.send({ error: 'Please enter E-mail which is registered with our services' });
    }

    const now = new Date();

    const recovery = await Recovery.findOne({
      where: {
        email: req.body.email,
      },
      attributes: ['email', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });

    if (recovery) {
      if (now.getTime() - recovery.createdAt.getTime() < 2 * 60 * 1000) {
        return res.send({ error: 'Cannot send code at this time' });
      }
    }

    return crypto.randomBytes(3, async (err, buff) => {
      if (err) {
        return res.send({ error: 'Unable to send code' });
      }

      const code = parseInt(buff.toString('hex'), 16).toString().substr(0, 6);

      await user.sendResetCode(code);

      return res.send();
    });
  } catch (e) {
    return SendOnError(e, res);
  }
});

router.post('/recover/new', accountAuth, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const recover = await Recovery.findOne({
      where: {
        email: req.body.email,
        code: req.body.code,
        used: false,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!recover) {
      throw new Error();
    }

    const now = new Date();

    if (now.getTime() - recover.createdAt.getTime() > 60 * 60 * 1000) {
      throw new Error();
    }

    if (req.body.password !== req.body.password2) {
      throw new Error();
    }

    await User.update({ password: req.body.password }, {
      where: {
        email: req.body.email,
      },
    });

    await Recovery.update({ used: true }, {
      where: {
        email: req.body.email,
        code: req.body.code,
      },
    });

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

  const t = await sequelize.transaction();

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

    if (data.username && data.username !== req.user!.username) {
      const newTokens = User.generateJWTAndUpdateArray(data.username, token!, req.user!.tokens);

      token = newTokens.token;
      data.tokens = newTokens.tokens;

      const studentUpdate = Student.update({
        username: data.username,
      }, {
        where: {
          username: req.user!.username,
        },
        transaction: t,
      });

      const resultUpdate = Result.update({
        responder: data.username,
      }, {
        where: {
          responder: req.user!.username,
        },
        transaction: t,
      });

      const deviceUpdate = Device.update({
        username: data.username,
      }, {
        where: {
          username: req.user!.username,
        },
        transaction: t,
      });

      const announceUpdate = Announcement.update({
        author: data.username,
      }, {
        where: {
          author: req.user!.username,
        },
        transaction: t,
      });

      const vidTrackerUpdate = VideoTracker.update({
        username: data.username,
      }, {
        where: {
          username: data.username,
        },
      });

      await Promise.all([
        studentUpdate, resultUpdate, deviceUpdate, announceUpdate, vidTrackerUpdate,
      ]);
    }

    const userToUpdate = await User.update(data, {
      where: {
        username: req.user!.username,
      },
      returning: true,
      transaction: t,
    });

    await t.commit();

    return res.send({ user: userToUpdate[1][0], token });
  } catch (e) {
    await t.rollback();
    return SendOnError(e, res);
  }
});

export default router;
