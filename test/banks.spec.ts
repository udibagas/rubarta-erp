import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('BanksController', () => {
  let app: INestApplication;
  let testService: TestService;
  let bank;
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

  it('POST /api/banks', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/banks')
      .send({
        code: 'BCA',
        name: 'Bank Central Asia',
      })
      .auth(token, { type: 'bearer' });

    bank = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.code).toBe('BCA');
    expect(response.body.name).toBe('Bank Central Asia');
  });

  it('GET /api/banks', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/banks')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/banks/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/banks/${bank.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.code).toBe('BCA');
    expect(response.body.name).toBe('Bank Central Asia');
  });

  it('PATCH /api/banks/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/banks/${bank.id}`)
      .send({
        code: 'BCAEDIT',
        name: 'Bank Central Asia Edit',
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.code).toBe('BCAEDIT');
    expect(response.body.name).toBe('Bank Central Asia Edit');
  });

  it('DELETE /api/banks/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/banks/${bank.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteUser();
    await testService.deleteBanks();
  });
});
