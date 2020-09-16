import req from 'supertest';

import { SeedDB, truncate, user1 } from './fixtures/db';

import app from '../src/app';
import { User } from '../src/models/User';

const user = {
  name: 'harshal',
  username: 'harshal22',
  email: 'harshal@exqample.com',
  password: 'mypass123',
};

beforeAll(SeedDB);

describe('Account related tests', () => {
  test('Should SignUp the user', async () => {
    const res = await req(app)
      .post('/users/create')
      .send({ user })
      .expect(201);

    const registeredUser = await User.findOne({
      where: {
        username: res.body.user.username,
      },
    });

    expect(registeredUser.tokens.length).toBeGreaterThanOrEqual(1);
    expect(res.body).toMatchObject({
      user: {
        name: registeredUser.name,
        username: registeredUser.username,
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

    expect(dbUser.tokens.length).toBeGreaterThanOrEqual(2);
  });

  test('Should not login user', async () => {
    await req(app)
      .post('/users/login')
      .send({
        user: {
          username: user.username,
          password: user1.password,
        },
      })
      .expect(404);
  });
});

afterAll(truncate);
