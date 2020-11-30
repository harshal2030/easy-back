/* eslint-disable no-unused-vars */
import { UserAttr } from '../models/User';
import { ClassAttr } from '../models/Class';

declare global {
  namespace Express {
    export interface Request {
      user?: UserAttr,
      token?: string,
      ownerClass?: ClassAttr,
    }
  }
}
