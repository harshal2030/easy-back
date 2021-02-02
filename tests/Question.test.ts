import req from 'supertest';
import path from 'path';
import app from '../src/app';
import {
  SeedDB, truncate, user1Class, class1Quiz1, user1, class4Quiz1,
} from './fixtures/db';
import { Question } from '../src/models/Questions';

beforeAll(SeedDB);

let queId: string;

describe('question post, edit, getter tests', () => {
  test('Should post the question', async () => {
    const res = await req(app)
      .post(`/que/${user1Class.id}/${class1Quiz1.quizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .field('info', JSON.stringify({
        question: 'this is a new question',
        options: ['hii', 'hey', 'bye', ''],
        correct: 'hii',
      }))
      .expect(201);

    const queInDb = await Question.findOne({
      where: {
        queId: res.body.queId,
      },
    });

    queId = queInDb.queId;

    expect(res.body).toMatchObject({
      queId: queInDb.queId,
      question: queInDb.question,
      options: queInDb.options,
      score: queInDb.score,
      attachments: queInDb.attachments,
    });

    expect(res.body.options.length).toBe(3);
  });

  test('Should not post the question on other quiz', async () => {
    await req(app)
      .post(`/que/${user1Class.id}/${class4Quiz1.quizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .field('info', JSON.stringify({
        question: 'this is a new question',
        options: ['hii', 'hey', 'bye', ''],
        correct: 'hii',
      }))
      .expect(400);
  });

  test('Should get the questions', async () => {
    const res = await req(app)
      .get(`/que/${user1Class.id}/${class1Quiz1.quizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    expect.extend({
      toBeStringOrNull(received) {
        return received === null || typeof received === 'string' ? {
          message: () => `expected ${received} to be string or null`,
          pass: true,
        } : {
          message: () => `expected ${received} to be string or null`,
          pass: false,
        };
      },
    });

    expect(res.body).toContainEqual({
      queId: expect.any(String),
      question: expect.any(String),
      options: expect.any(Array),
      score: expect.any(Number),
      // @ts-ignore
      attachments: expect.toBeStringOrNull(),
    });
  });

  test('Should not get the questions', async () => {
    await req(app)
      .get(`/que/${user1Class.id}/${class4Quiz1.quizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(400);
  });

  test('Should edit the question', async () => {
    const res = await req(app)
      .put(`/que/${user1Class.id}/${class1Quiz1.quizId}/${queId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .field('info', JSON.stringify({
        question: 'this is a new question',
        options: ['hii', 'hey', 'bye', ''],
        correct: 'hii',
      }))
      .attach('media', path.join(__dirname, '../../app ss/phone/Screenshot_2021-01-20-21-36-06-62_879d937d5d3652542b7f9f1e7dc91e41.png'))
      .expect(200);

    expect(res.body).toMatchObject({
      queId: expect.any(String),
      question: expect.any(String),
      options: expect.any(Array),
      score: expect.any(Number),
      attachments: expect.any(String),
    });
  });

  test('Should not edit the question', async () => {
    await req(app)
      .put(`/que/${user1Class.id}/${class4Quiz1.quizId}/${queId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .field('info', JSON.stringify({
        question: 'this is a new question',
        options: ['hii', 'hey', 'bye', ''],
        correct: 'hii',
      }))
      .attach('media', path.join(__dirname, '../../app ss/phone/Screenshot_2021-01-20-21-36-06-62_879d937d5d3652542b7f9f1e7dc91e41.png'))
      .expect(400);
  });
});

afterAll(truncate);
