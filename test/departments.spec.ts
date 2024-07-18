import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('DepartmentsController', () => {
  let app: INestApplication;
  let testService: TestService;
  let department;
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

  it('POST /api/departments', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/departments')
      .send({
        code: 'OPS',
        name: 'Operation',
      })
      .auth(token, { type: 'bearer' });

    department = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.code).toBe('OPS');
    expect(response.body.name).toBe('Operation');
  });

  it('GET /api/departments', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/departments')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/departments/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/departments/${department.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/departments/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/departments/${department.id}`)
      .send({
        code: 'OPSEDIT',
        name: 'Operation Edit',
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.code).toBe('OPSEDIT');
    expect(response.body.name).toBe('Operation Edit');
  });

  it('DELETE /api/departments/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/departments/${department.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteUser();
    await testService.deleteCompanies();
  });
});
