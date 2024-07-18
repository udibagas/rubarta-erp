import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('ExpenseNotesController', () => {
  let app: INestApplication;
  let testService: TestService;
  let expenseNote;
  let token;
  let expenseType;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testService = app.get(TestService);
    await testService.createUser();
    token = testService.createToken();
    expenseType = await testService.createExpenseType();
  });

  it('POST /api/expense-notes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/expense-notes')
      .send({
        date: new Date(),
        expenseTypeId: expenseType.id,
        description: 'BBM Pertamax 10 Liter',
        amount: 100_000,
      })
      .auth(token, { type: 'bearer' });

    expenseNote = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.description).toBe('BBM Pertamax 10 Liter');
    expect(response.body.amount).toBe(100_000);
  });

  it('GET /api/expense-notes', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/expense-notes')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/expense-notes/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/expense-notes/${expenseNote.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/expense-notes/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/expense-notes/${expenseNote.id}`)
      .send({
        date: new Date(),
        expenseTypeId: expenseType.id,
        description: 'BBM Pertamax 20 Liter',
        amount: 200_000,
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.description).toBe('BBM Pertamax 20 Liter');
    expect(response.body.amount).toBe(200_000);
  });

  it('DELETE /api/expense-notes/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/expense-notes/${expenseNote.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteExpenseNotes();
    await testService.deleteExpenseTypes();
    await testService.deleteUser();
  });
});
