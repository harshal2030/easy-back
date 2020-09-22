import req from 'supertest';
import { SeedDB, truncate, user1 } from './fixtures/db';

import app from '../src/app';
import { Class } from '../src/models/Class';

beforeAll(SeedDB);

describe('Class creation, update, getter tests', () => {
  test('Should create the class', async () => {
    const res = await req(app)
      .post('/class/create')
      .send({
        name: 'class',
        about: 'this is class',
      })
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(201);

    const Sec = await Class.findOne({
      where: {
        id: res.body.id,
      },
    });

    expect(res.body).toMatchObject(Sec);
  });
});

afterAll(truncate);
