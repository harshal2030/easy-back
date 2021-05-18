import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

import { Class } from '../models/Class';
import { Payment } from '../models/Payment';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import { plans } from '../utils/plans';

const router = express.Router();

router.get('/:classId/:planId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const plan: string = req.params.planId ? req.params.planId : 'standard';
    let amount: number = 10000; // amount in paisa

    if (plan === 'standard') {
      amount = 10000;
    }

    const order = await axios.post('https://api.razorpay.com/v1/orders', {
      amount,
      currency: 'INR',
      receipt: 'receipt#1',
      notes: {
        plan,
      },
    }, {
      auth: {
        username: process.env.key_id!,
        password: process.env.key_secret!,
      },
    });

    await Class.update({
      planId: plan,
    }, {
      where: {
        id: req.params.classId,
      },
      limit: 1,
    });

    res.send({
      orderId: order.data.id,
      amount: order.data.amount,
      currency: order.data.currency,
      planId: plan,
    });
  } catch (e) {
    SendOnError(e, res);
  }
});

router.delete('/:classId', auth, mustBeClassOwner, async (req, res) => {
  try {
    await Class.update({
      payedOn: null,
      payId: null,
      planId: 'free',
    }, {
      where: {
        id: req.params.classId,
      },
      limit: 1,
      returning: true,
    });

    res.send();
  } catch (e) {
    SendOnError(e, res);
  }
});

router.post('/:classId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const {
      amountPayed, orderId, paymentId, signature,
    } = req.body as {
      amountPayed: number;
      signature: string;
      paymentId: string;
      orderId: string;
    };

    if (amountPayed !== plans[req.ownerClass!.planId].price) {
      await Class.update({
        payId: null,
        payedOn: null,
        planId: 'free',
      }, {
        where: {
          id: req.params.classId,
        },
        limit: 1,
      });

      res.status(400).send({ error: 'Invalid params' });
      return;
    }

    const hmac = crypto.createHmac('sha256', process.env.key_secret!);
    hmac.update(`${orderId}|${paymentId}`);

    const serverSignature = hmac.digest('hex');

    if (serverSignature !== signature) {
      await Class.update({
        payId: null,
        payedOn: null,
        planId: 'free',
      }, {
        where: {
          id: req.params.classId,
        },
        limit: 1,
      });
      res.status(400).send({ error: 'Payment failed' });
      return;
    }

    const classToUpdate = await Class.update({
      payId: paymentId,
      payedOn: new Date(),
      planId: req.ownerClass!.planId,
    }, {
      where: {
        id: req.params.classId,
      },
      limit: 1,
      returning: true,
    });

    await Payment.create({
      classId: req.params.classId,
      orderId,
      paymentId,
      signature,
    });

    const {
      id, name, about, photo, collaborators, subject, joinCode, lockJoin, payId, payedOn,
    } = classToUpdate[1][0];

    res.send({
      id,
      name,
      about,
      payId,
      payedOn,
      planId: classToUpdate[1][0].planId,
      photo,
      collaborators,
      subject,
      joinCode,
      lockJoin,
      owner: {
        username: req.user!.username,
        avatar: req.user!.avatar,
        name: req.user!.name,
      },
    });
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
