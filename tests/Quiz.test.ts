import req from 'supertest';
import path from 'path';
import app from '../src/app';
import { Quiz } from '../src/models/Quiz';
import {
  user1, user1Class, SeedDB, truncate, user2, user3,
} from './fixtures/db';

beforeAll(SeedDB);

let QuizId: string;

describe('Quiz update, post, getter tests', () => {
  test('Should post quiz by owner', async () => {
    const res = await req(app)
      .post(`/quiz/${user1Class.id}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .attach('sheet', path.join(__dirname, '../sample.xlsx'))
      .field('info', JSON.stringify({
        questions: 5,
        title: 'a test',
        description: 'this is a test',
        timePeriod: [Date.now() - 1 * 1000 * 60 * 60 * 24, Date.now() + 1 * 1000 * 60 * 60 * 24],
      }))
      .expect(201);

    const quiz = await Quiz.findOne({
      where: {
        quizId: res.body.quizId,
      },
    });

    expect(res.body).toMatchObject({
      ...quiz!.toJSON(),
      createdAt: quiz!.createdAt.toJSON(),
      updatedAt: quiz!.updatedAt.toJSON(),
      timePeriod: [
        { value: quiz!.timePeriod[0].value.toJSON(), inclusive: expect.any(Boolean) },
        { value: quiz!.timePeriod[1].value.toJSON(), inclusive: expect.any(Boolean) },
      ],
    });

    QuizId = quiz!.quizId;
  });

  test('Should not post quiz by non-owner', async () => {
    await req(app)
      .post(`/quiz/${user1Class.id}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .attach('sheet', path.join(__dirname, '../sample.xlsx'))
      .field('info', JSON.stringify({ questions: 5, title: 'a test', description: 'this is a test' }))
      .expect(401);
  });

  test('Should get the list of quizzes', async () => {
    const res = await req(app)
      .get(`/quiz/${user1Class.id}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .expect(200);

    expect(res.body).toMatchObject({
      live: expect.any(Array),
      expired: expect.any(Array),
      scored: expect.any(Array),
    });

    expect(res.body.live).toContainEqual({
      classId: expect.any(String),
      quizId: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      timePeriod: [
        { value: expect.any(String), inclusive: expect.any(Boolean) },
        { value: expect.any(String), inclusive: expect.any(Boolean) },
      ],
      releaseScore: expect.any(Boolean),
    });
  });

  test('Should get the quiz info by owner', async () => {
    const res = await req(app)
      .get(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .expect(200);

    expect(res.body).toMatchObject({
      classId: expect.any(String),
      quizId: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
      timePeriod: [
        { value: expect.any(String), inclusive: expect.any(Boolean) },
        { value: expect.any(String), inclusive: expect.any(Boolean) },
      ],
      releaseScore: expect.any(Boolean),
      questions: expect.any(Number),
      randomQue: expect.any(Boolean),
      randomOp: expect.any(Boolean),
    });
  });

  test('Should update the quiz by owner', async () => {
    const res = await req(app)
      .put(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .send({
        questions: 4,
        title: 'new title',
        description: 'this is description',
        timePeriod: [Date.now() - 1 * 1000 * 60 * 60 * 24, Date.now() + 1 * 1000 * 60 * 60 * 24],
      })
      .expect(200);

    expect(res.body).toMatchObject({
      classId: user1Class.id,
      quizId: expect.any(String),
      title: 'new title',
      description: expect.any(String),
      timePeriod: [
        { value: expect.any(String), inclusive: expect.any(Boolean) },
        { value: expect.any(String), inclusive: expect.any(Boolean) },
      ],
      releaseScore: expect.any(Boolean),
      questions: 4,
      randomQue: expect.any(Boolean),
      randomOp: expect.any(Boolean),
    });

    await req(app)
      .put(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .send({
        questions: 4,
        title: 'new title',
        description: 'this is description',
        timePeriod: [Date.now() - 1 * 1000 * 60 * 60 * 24, Date.now() + 1 * 1000 * 60 * 60 * 24],
      })
      .expect(401);
  });
});

describe('Questions getters and post tests', () => {
  let questions: any;

  test('Should not get the quiz info by non owner', async () => {
    await req(app)
      .get(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .expect(401);
  });

  test('Should get questions when requested by owner or student', async () => {
    const res = await req(app)
      .get(`/quiz/que/${user1Class.id}/${QuizId}`)
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

    questions = res.body.questions;

    expect(res.body.questions).toContainEqual({
      question: expect.any(String),
      queId: expect.any(String),
      // @ts-ignore
      attachments: expect.toBeStringOrNull(),
      options: expect.any(Array),
      score: expect.any(Number),
    });

    await req(app)
      .get(`/quiz/que/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .expect(200);
  });

  test('Should not get the question when requested by outsider', async () => {
    await req(app)
      .get(`/quiz/que/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user3.tokens}`)
      .expect(401);
  });

  test('Should post the response', async () => {
    const res = await req(app)
      .post(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .send({
        response: questions.map((val) => ({ queId: val.queId, response: val.options[1] })),
      })
      .expect(200);

    expect(res.body).toMatchObject({
      releaseScore: expect.any(Boolean),
    });

    await req(app)
      .post(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user2.tokens[0]}`)
      .send({
        response: questions.map((val) => ({ queId: val.queId, response: val.options[1] })),
      })
      .expect(200);
  });

  test('Should not post the response when submitting again or third party', async () => {
    await req(app)
      .post(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user1.tokens[0]}`)
      .send({
        response: questions.map((val) => ({ queId: val.queId, response: val.options[1] })),
      })
      .expect(400);

    await req(app)
      .post(`/quiz/${user1Class.id}/${QuizId}`)
      .set('Authorization', `Bearer ${user3.tokens[0]}`)
      .send({
        response: questions.map((val) => ({ queId: val.queId, response: val.options[1] })),
      })
      .expect(401);
  });
});

afterAll(truncate);
