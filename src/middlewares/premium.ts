/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express';

import { oneMonthDiff } from '../utils/plans';

const premiumService = (req: Request, res: Response, next: NextFunction) => {
  if (!req.ownerClass) {
    res.status(401).send({ error: 'Upgrade to paid plan to use this feature or request the owner' });
    return;
  }

  if (req.ownerClass.planId === 'free') {
    res.status(401).send({ error: 'Upgrade to paid plan to use this feature or request the owner' });
    return;
  }

  if (req.ownerClass.planId === 'standard') {
    if (!req.ownerClass.payedOn) {
      res.status(401).send({ error: 'Upgrade to paid plan to use this feature or request the owner' });
      return;
    }

    const timePassed = new Date().getTime() - req.ownerClass.payedOn.getTime();

    if (timePassed > oneMonthDiff) {
      res.status(401).send({ error: 'Upgrade to paid plan to use this feature or request the owner' });
      return;
    }
  }

  next();
};

export { premiumService };
