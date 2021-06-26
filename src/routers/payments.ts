import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import { Op } from 'sequelize';
import sequelize from '../db';

import { Class } from '../models/Class';
import { Payment } from '../models/Payment';
import { Offer } from '../models/Offer';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';
import { plans, offers } from '../utils/plans';

const router = express.Router();

router.post('/order/:classId', auth, mustBeClassOwner, async (req, res) => {
  const t100 = await sequelize.transaction();
  try {
    const plan: string = req.body.planId ? req.body.planId : 'standard';
    let amount: number = 10000; // amount in paisa

    if (plan === 'standard') {
      amount = 10000;
    }

    let offerId: null | string = null;

    if (req.body.coupon) {
      const offer = await Offer.findOne({
        where: {
          email: {
            [Op.or]: [req.user!.email, null],
          },
          code: req.body.coupon,
          planId: plan,
        },
      });

      if (!offer) {
        res.send({ error: 'Invalid coupon code' });
        return;
      }

      offerId = offer.offerId;

      if (offer && offers[offer.code] && offers[offer.code].amountOff === amount) {
        const classToUpdateRef = Class.update({
          payId: 'server_100',
          payedOn: new Date(),
          planId: plan,
        }, {
          where: {
            id: req.params.classId,
          },
          limit: 1,
          returning: true,
          transaction: t100,
        });

        const payRef = Payment.create({
          classId: req.params.classId,
          orderId: 'server_order',
          paymentId: 'server_100',
          signature: 'server_sign',
        }, {
          transaction: t100,
        });

        const [classToUpdate] = await Promise.all([classToUpdateRef, payRef]);

        if (offer.email) {
          offer.used = true;
          await offer.save({ transaction: t100 });
        }

        await t100.commit();

        const {
          id,
          name,
          about,
          photo,
          collaborators,
          subject,
          joinCode,
          lockJoin,
          payId,
          payedOn,
          storageUsed,
        } = classToUpdate[1][0];

        res.send({
          proceedToPay: false,
          class: {
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
            storageUsed: parseInt(storageUsed, 10),
            owner: {
              username: req.user!.username,
              avatar: req.user!.avatar,
              name: req.user!.name,
            },
          },
        });
        return;
      }
    }

    const orderOptions: {
      amount: number; currency: string; notes: { [id: string]: string }; offers?: string[]
    } = {
      amount,
      currency: 'INR',
      notes: {
        plan,
      },
    };

    if (offerId) {
      orderOptions.offers = [offerId];
    }

    const order = await axios.post('https://api.razorpay.com/v1/orders', orderOptions, {
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
      transaction: t100,
    });

    await t100.commit();
    res.send({
      proceedToPay: true,
      order: {
        orderId: order.data.id,
        amount: order.data.amount,
        currency: order.data.currency,
        planId: plan,
      },
    });
  } catch (e) {
    await t100.rollback();
    SendOnError(e, res);
  }
});

router.delete('/:classId', auth, mustBeClassOwner, async (req, res) => {
  try {
    await Class.update({
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
      id,
      name,
      about,
      photo,
      collaborators,
      subject,
      joinCode,
      lockJoin,
      payId,
      payedOn,
      storageUsed,
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
      storageUsed: parseInt(storageUsed, 10),
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
