import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('UsersController', () => {
  let app: INestApplication;
  let testService: TestService;
  let user;
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

  it('POST /api/users', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send({
        name: 'Test',
        email: 'test@mail.com',
        password: 'rahasia123',
        roles: ['USER'],
      })
      .auth(token, { type: 'bearer' });

    user = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.name).toBe('Test');
    expect(response.body.email).toBe('test@mail.com');
    expect(response.body.roles).toStrictEqual(['USER']);
  });

  it('GET /api/users', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/users/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/users/${user.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/users/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/users/${user.id}`)
      .send({
        name: 'Test Edit',
        email: 'testedit@mail.com',
        roles: ['APPROVER'],
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.name).toBe('Test Edit');
    expect(response.body.email).toBe('testedit@mail.com');
    expect(response.body.roles).toStrictEqual(['APPROVER']);
  });

  it('DELETE /api/users/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/users/${user.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteUser();
  });
});
