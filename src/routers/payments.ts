import express from 'express';
import axios from 'axios';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner } from '../middlewares/userLevels';

import { SendOnError } from '../utils/functions';

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

    res.send({ orderId: order.data.id, amount: order.data.amount, currency: order.data.currency });
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
