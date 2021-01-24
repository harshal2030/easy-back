import req from 'supertest';
import {
  SeedDB, truncate, user1, user1Class, user2, user1Class2,
} from './fixtures/db';
import { Class } from '../src/models/Class';

import app from '../src/app';

beforeAll(SeedDB);

describe('Class creation, update, getter tests', () => {
  test('Should create the class', async () => {
    const res = await req(app)
      .post('/class')
      .field('info', JSON.stringify({ name: 'class', about: 'this is a class', subject: 'cs' }))
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(201);

    const dbClass = await Class.findOne({
      where: {
        name: 'class',
      },
    });

    expect(dbClass!.id).toEqual(res.body.id);
    expect(res.body).toMatchObject({
      id: dbClass!.id,
      name: dbClass!.name,
      photo: dbClass!.photo,
      collaborators: dbClass!.collaborators,
      subject: dbClass!.subject,
      joinCode: dbClass!.joinCode,
      lockJoin: dbClass!.lockJoin,
      owner: {
        name: user1.name,
        username: user1.username,
        avatar: user1.avatar,
      },
    });
    expect(res.body.owner.username).toEqual(dbClass!.ownerRef);
  });

  test('Should get list of classes', async () => {
    const res = await req(app)
      .get('/class')
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('Should get the class by Id', async () => {
    const res = await req(app)
      .get(`/class/${user1Class.id}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    const dbClass = await Class.findOne({
      where: {
        id: user1Class.id,
      },
    });

    expect(res.body).toMatchObject({
      id: dbClass!.id,
      name: dbClass!.name,
      photo: dbClass!.photo,
      collaborators: dbClass!.collaborators,
      subject: dbClass!.subject,
      joinCode: dbClass!.joinCode,
      lockJoin: dbClass!.lockJoin,
      owner: {
        username: user1.username,
        name: user1.name,
        avatar: user1.avatar,
      },
    });
  });

  test('Should join class', async () => {
    const res = await req(app)
      .post('/class/join')
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .send({ joinCode: user1Class.joinCode })
      .expect(200);

    const dbClass = await Class.findOne({
      where: {
        id: user1Class.id,
      },
    });

    expect(res.body).toMatchObject({
      id: dbClass!.id,
      name: dbClass!.name,
      photo: dbClass!.photo,
      collaborators: dbClass!.collaborators,
      subject: dbClass!.subject,
      joinCode: dbClass!.joinCode,
      owner: {
        username: user1.username,
        name: user1.name,
        avatar: user1.avatar,
      },
    });
  });

  test('Should not join class when lockJoin or itself owner makes requests', async () => {
    await req(app)
      .post('/class/join')
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .send({ joinCode: user1Class.joinCode })
      .expect(404);

    await req(app)
      .post('/class/join')
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .send({ joinCode: user1Class2.joinCode })
      .expect(404);
  });
});

afterAll(truncate);
