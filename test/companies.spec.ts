import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('CompaniesController', () => {
  let app: INestApplication;
  let testService: TestService;
  let company;
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

  it('POST /api/companies', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/companies')
      .send({
        code: 'RPA',
        name: 'PT Rubarta Prima Abadi',
      })
      .auth(token, { type: 'bearer' });

    company = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.code).toBe('RPA');
    expect(response.body.name).toBe('PT Rubarta Prima Abadi');
  });

  it('GET /api/companies', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/companies')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/companies/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/companies/${company.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/companies/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/companies/${company.id}`)
      .send({
        code: 'RPATEST',
        name: 'PT Rubarta PPrima Abadi Test',
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.code).toBe('RPATEST');
    expect(response.body.name).toBe('PT Rubarta PPrima Abadi Test');
  });

  it('DELETE /api/companies/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/companies/${company.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteUser();
    await testService.deleteCompanies();
  });
});
