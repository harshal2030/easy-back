import req from 'supertest';
import app from '../src/app';
import {SeedDB, truncate} from './fixtures/db';

beforeAll(SeedDB);

describe('Module creation, update, getter tests', async () => {
  test('')
})

afterAll(truncate);
