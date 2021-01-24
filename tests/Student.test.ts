import req from 'supertest';
import app from '../src/app';
import {
  user1, user1Class, SeedDB, truncate, user2, user1Class2,
} from './fixtures/db';

beforeAll(SeedDB);

describe('Tests for getting students in class and remove them', () => {
  test('Should get students in a class', async () => {
    const res = await req(app)
      .get(`/student/${user1Class.id}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    expect(res.body).toContainEqual({
      name: expect.any(String),
      username: expect.any(String),
      avatar: expect.any(String),
    });
  });

  test('Should unEnroll by themselves', async () => {
    await req(app)
      .delete(`/student/${user2.username}/${user1Class.id}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .expect(200);
  });

  test('Should be removed by owner', async () => {
    await req(app)
      .delete(`/student/${user2.username}/${user1Class2.id}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);
  });
});

afterAll(truncate);
