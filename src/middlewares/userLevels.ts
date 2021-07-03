import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
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

    req.ownerClass = owner;
    next();
  } catch (e) {
    res.status(401).send({ error: "You're forbidden to access this resource" });
  }
};

const mustBeStudentOrOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestedClass = await Class.findOne({
      where: {
        id: req.params.classId,
        [Op.or]: {
          ownerRef: req.user?.username,
          '$students.username$': req.user?.username,
        },
      },
      attributes: ['id', 'name', 'about', 'photo', 'collaborators', 'ownerRef', 'subject', 'joinCode', 'lockJoin', 'payId', 'payedOn', 'planId', 'storageUsed', 'lockMsg'],
      include: [
        {
          model: Student,
          as: 'students',
          attributes: [],
          required: false,
        },
      ],
    });

    if (!requestedClass) {
      throw new Error();
    }

    req.ownerClass = requestedClass;
    next();
  } catch (e) {
    res.status(401).send({ error: "You're forbidden to access this resource" });
  }
};

export { mustBeClassOwner, mustBeStudentOrOwner };
