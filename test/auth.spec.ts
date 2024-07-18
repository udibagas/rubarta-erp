import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestService } from './test.service';
import { TestModule } from './test.module';

describe('AuthController', () => {
  let app: INestApplication;
  let testService: TestService;
  let token;
  let user;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testService = app.get(TestService);
    user = await testService.createUser();
  });

  it('/auth (POST)', async () => {
    const response = await request(app.getHttpServer()).post('/auth').send({
      email: user.email,
      password: 'password',
    });

    token = response.body.token;
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.token).toBeDefined();
  });

  it('/auth (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(200);
    expect(response.body.email).toBe(user.email);
  });

  afterAll(async () => {
    await testService.deleteUser();
  });
});
