/* eslint-disable no-unused-vars */
import { UserAttr } from '../models/User';
import { ClassAttr } from '../models/Class';

declare global {
  namespace Express {
    export interface Request {
      user?: UserAttr, // available with every auth middleware
      token?: string, // available with every auth middleware
      ownerClass?: ClassAttr, // only available with mustBeClassOwner middleware
      username?: string, // only available with checkWithToken middleware
    }
  }
}
