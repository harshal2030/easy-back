import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { User, UserAttr } from '../../src/models/User';

const privateKeyPath = path.join(__dirname, '../../keys/private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

const user1: UserAttr = {
  id: 1,
  name: 'Harshal',
  username: 'harshal223',
  email: 'harshal@example.com',
  password: 'sdjfhsdkfjhsdk',
  tokens: [jwt.sign({ username: 'harshal22' }, privateKey, { algorithm: 'RS256' })],
};

const user2: UserAttr = {
  id: 2,
  name: 'john',
  username: 'john',
  email: 'john@doe.com',
  password: 'jshlsdkjfghlsdfjghlsdfkgj',
  tokens: [jwt.sign({ username: 'john' }, privateKey, { algorithm: 'RS256' })],
};

const SeedDB = async () => {
  try {
    await User.bulkCreate([user1, user2]);
  } catch (e) {
    console.log(e);
  }
};

const truncate = async () => {
  try {
    await User.destroy({ truncate: true });
  } catch (e) {
    console.log(e);
  }
};

export {
  user1, user2, SeedDB, truncate,
};
