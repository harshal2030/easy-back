import req from 'supertest';
import app from '../src/app';
import { Announcement } from '../src/models/Announcement';
import {
  user1, user1Class, SeedDB, truncate, user2, user3,
} from './fixtures/db';

beforeAll(SeedDB);

describe('Message service tests', () => {
  test('Owner should post message', async () => {
    const res = await req(app)
      .post(`/msg/${user1Class.id}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .send({ message: 'This is a message' })
      .expect(200);

    const inDbMsg = await Announcement.findOne({
      where: {
        id: res.body.id,
      },
    });

    expect(res.body).toMatchObject({
      id: inDbMsg!.id,
      message: inDbMsg!.message,
      user: {
        name: user1.name,
        username: user1.username,
        avatar: user1.avatar,
      },
      createdAt: inDbMsg!.createdAt.toJSON(),
    });
  });

  test('Student Should not post message', async () => {
    await req(app)
      .post(`/msg/${user1Class.id}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .send({ message: 'this is message' })
      .expect(401);
  });

  test('Student or owner should get message', async () => {
    const res = await req(app)
      .get(`/msg/${user1Class.id}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    await req(app)
      .get(`/msg/${user1Class.id}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .expect(200);

    expect(res.body).toContainEqual({
      id: expect.any(String),
      message: expect.any(String),
      user: {
        name: expect.any(String),
        username: expect.any(String),
        avatar: expect.any(String),
      },
      createdAt: expect.any(String),
    });
  });

  test('Outsider should not get message', async () => {
    await req(app)
      .get(`/msg/${user1Class.id}`)
      .set('Authorization', `Bearer ${user3.tokens[0]}`)
      .expect(401);
  });
});

afterAll(truncate);
