import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

import { User, UserAttr } from '../../src/models/User';
import { Class } from '../../src/models/Class';
import { Announcement } from '../../src/models/Announcement';
import { Device } from '../../src/models/Device';
import { Question } from '../../src/models/Questions';
import { Quiz } from '../../src/models/Quiz';
import { Result } from '../../src/models/Result';
import { Student } from '../../src/models/Student';
import sequelize from '../../src/db';

const privateKeyPath = path.join(__dirname, '../../../keys/private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

const user1: UserAttr = {
  id: 1,
  name: 'Harshal',
  username: 'harshal223',
  email: 'harshal@example.com',
  avatar: 'default.png',
  password: 'sdjfhsdkfjhsdk',
  tokens: [jwt.sign({ username: 'harshal223' }, privateKey, { algorithm: 'RS256' })],
};

const user1Class = {
  id: nanoid(),
  name: 'hello',
  subject: 'phy',
  about: 'no about',
  ownerRef: 'harshal223',
  joinCode: nanoid(12),
};

const user1Class2 = {
  id: nanoid(),
  name: 'hello',
  subject: 'phy',
  about: 'no about',
  ownerRef: 'harshal223',
  lockJoin: true,
  joinCode: nanoid(12),
};

const user1Device = {
  username: user1.username,
  token: user1.tokens[0],
  os: 'Android',
  fcmToken: 'sdlkfjalsdkfj;sdfsadjhlfhasdlfjhasdljfhasldkjfhsdjf',
};

const user2: UserAttr = {
  id: 2,
  name: 'john',
  username: 'john',
  avatar: 'default.png',
  email: 'john@doe.com',
  password: 'jshlsdkjfghlsdfjghlsdfkgj',
  tokens: [jwt.sign({ username: 'john' }, privateKey, { algorithm: 'RS256' })],
};

const user3: UserAttr = {
  id: 3,
  name: 'john3',
  username: 'john3',
  avatar: 'default.png',
  email: 'john3@doe.com',
  password: 'jshlsdkjfghlsdfjghlsdfkgj',
  tokens: [jwt.sign({ username: 'john3' }, privateKey, { algorithm: 'RS256' })],
};

const user2Device = {
  username: user2.username,
  token: user2.tokens[0],
  os: 'Android',
  fcmToken: 'sdlkfjalsdkfj;sdfsadasdfdfsdfasldkjfhsdjf',
};

const SeedDB = async () => {
  try {
    await User.bulkCreate([user1, user2, user3]);
    await Device.bulkCreate([user1Device, user2Device]);
    await Class.bulkCreate([user1Class, user1Class2]);
    await Student.bulkCreate([
      { username: user2.username, classId: user1Class.id },
      { username: user2.username, classId: user1Class2.id },
    ]);
  } catch (e) {
    console.log(e);
  }
};

const truncate = async () => {
  try {
    await Class.truncate({ cascade: true });
    await User.truncate({ cascade: true });
    await Announcement.truncate();
    await Device.truncate();
    await Student.truncate();
    await Quiz.truncate();
    await Question.truncate();
    await Result.truncate();
    await sequelize.close();
  } catch (e) {
    console.log(e);
  }
};

export {
  user1, user2, user1Class, SeedDB, truncate, user1Class2, user3,
};
