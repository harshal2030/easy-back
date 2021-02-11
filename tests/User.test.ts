import req from 'supertest';

import {
  SeedDB, truncate, user1, user2,
} from './fixtures/db';

import app from '../src/app';
import { User } from '../src/models/User';

const user = {
  name: 'harshal',
  username: 'harshal22',
  email: 'harshal@exqample.com',
  password: 'mypass123',
};

beforeAll(SeedDB);

describe('Login and Account creation tests', () => {
  test('Should SignUp the user', async () => {
    const res = await req(app)
      .post('/users/create')
      .auth('accountCreator', process.env.accPass!)
      .send({ user })
      .expect(201);

    const registeredUser = await User.findOne({
      where: {
        username: res.body.user.username,
      },
    });

    expect(registeredUser!.tokens.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toMatchObject({
      user: {
        name: registeredUser!.name,
        username: registeredUser!.username,
        avatar: registeredUser!.avatar,
      },
      token: expect.any(String),
    });

    expect(res.body.user).not.toHaveProperty(['email', 'password', 'tokens']);
  });

  test.concurrent.each([
    ['Invalid email', 'harshal', 'username', 'sdfgsdf#', 'thisismypass'],
    ['Already existing username', 'harshal', user1.username, 'harshal@exam.com', 'password'],
    ['For short password', 'harshal', 'harshal89', 'harshal45@exam.com', 'this'],
  ])('Should fail, %s', async (_errMsg, name, username, email, password) => {
    await req(app)
      .post('/users/create')
      .auth('accountCreator', process.env.accPass!)
      .send({
        user: {
          name,
          username,
          email,
          password,
        },
      })
      .expect(400);
  });

  test('Should Log In the user', async () => {
    const res = await req(app)
      .post('/users/login')
      .auth('accountCreator', process.env.accPass!)
      .send({
        user: {
          username: user.username,
          password: user.password,
        },
      })
      .expect(200);

    expect(res.body).toMatchObject({
      user: {
        name: user.name,
        username: user.username,
      },
      token: expect.any(String),
    });

    const dbUser = await User.findOne({
      where: {
        username: user.username,
      },
    });

    expect(dbUser!.tokens.length).toBeGreaterThanOrEqual(2);
  });

  test('Should not login user', async () => {
    await req(app)
      .post('/users/login')
      .auth('accountCreator', process.env.accPass!)
      .send({
        user: {
          username: user.username,
          password: user1.password,
        },
      })
      .expect(404);
  });
});

describe('tests for token validation, logout and profile update', () => {
  test('Get user with correct token', async () => {
    const res = await req(app)
      .get('/users/token')
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    const checkMessage = ['CONTINUE', 'UPDATE_REQUIRED', 'SERVER_MAINTENANCE'].filter((val) => val === res.body.message).length;
    expect(checkMessage).toBeGreaterThan(0);

    expect(res.body).toMatchObject({
      user: {
        name: user1.name,
        username: user1.username,
        avatar: user1.avatar,
      },
      message: expect.any(String),
    });
  });

  test('Should log out', async () => {
    await req(app)
      .post('/users/logout')
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    const dbUser = await User.findOne({
      where: {
        username: user.username,
      },
    });

    const token = dbUser!.tokens.findIndex((val) => val === user1.tokens[0]);
    expect(token).toBe(-1);
  });

  test('Should update profile', async () => {
    const res = await req(app)
      .put('/users')
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .field('info', JSON.stringify({ name: 'New name', username: 'new_username' }))
      .expect(200);

    expect(res.body.user.username).toEqual('new_username');
    expect(res.body.token).not.toBe(user2.tokens[0]);
  });
});

afterAll(truncate);
