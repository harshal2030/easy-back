/* eslint-disable no-unused-vars */
import { UserAttr } from '../models/User';

declare global {
  namespace Express {
    export interface Request {
      user?: UserAttr,
      token?: string,
    }
  }
}
