/* eslint-disable no-unused-vars */
import { User, UserAttr } from '../models/User';
import { ClassAttr } from '../models/Class';

declare module 'socket.io/dist/socket' {
  export interface Socket {
    user?: User;
  }
}

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
