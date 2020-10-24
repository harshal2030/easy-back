import { Request, Response, NextFunction } from 'express';
import { Class } from '../models/Class';
import { Student } from '../models/Student';

const mustBeClassOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const owner = await Class.findOne({
      where: {
        id: req.params.classId,
        ownerRef: req.user!.username,
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

const mustBeStudentOrOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [owner, student] = await Promise.all([
      Class.findOne({
        where: {
          id: req.params.classId,
          ownerRef: req.user!.username,
        },
      }),
      Student.findOne({
        where: {
          classId: req.params.classId,
          username: req.user!.username,
        },
      }),
    ]);

    if (!(owner || student)) {
      throw new Error();
    }

    next();
  } catch (e) {
    res.status(401).send({ error: "You're forbidden to access this resource" });
  }
};

export { mustBeClassOwner, mustBeStudentOrOwner };
