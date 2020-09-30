import { Request, Response, NextFunction } from 'express';
import { Class } from '../models/Class';

const mustBeClassOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owner = await Class.findOne({
      where: {
        id: req.params.classId,
        owner: req.user!.username,
      },
    });

    if (!owner) {
      throw new Error();
    }

    next();
  } catch (e) {
    res.status(401).send({ error: "You're forbidden to access this resource" });
  }
};

// eslint-disable-next-line import/prefer-default-export
export { mustBeClassOwner };
