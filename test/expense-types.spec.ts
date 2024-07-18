import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('ExpenseTypesController', () => {
  let app: INestApplication;
  let testService: TestService;
  let expenseType;
  let token;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testService = app.get(TestService);
    await testService.createUser();
    token = testService.createToken();
  });

  it('POST /api/expense-types', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/expense-types')
      .send({
        name: 'FUEL',
      })
      .auth(token, { type: 'bearer' });

    expenseType = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.name).toBe('FUEL');
  });

  it('GET /api/expense-types', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/expense-types')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/expense-types/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/expense-types/${expenseType.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.name).toBe('FUEL');
  });

  it('PATCH /api/expense-types/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/expense-types/${expenseType.id}`)
      .send({
        name: 'FUEL EDIT',
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.name).toBe('FUEL EDIT');
  });

  it('DELETE /api/expense-types/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/expense-types/${expenseType.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteUser();
  });
});
