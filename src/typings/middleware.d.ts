/* eslint-disable no-unused-vars */
import { Server } from 'socket.io';
import { User, UserAttr } from '../models/User';
import { Class } from '../models/Class';

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
      ownerClass?: Class,
      username?: string, // only available with checkWithToken middleware
      io: Server;
    }
  }
}
