import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';

describe('NotificationsController', () => {
  let app: INestApplication;
  let testService: TestService;
  let token;
  let notifications;
  let user;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testService = app.get(TestService);
    user = await testService.createUser();
    token = testService.createToken();
    notifications = await testService.createNotification(user.id);
  });

  it('can send notification', async () => {
    const result = await testService.sendNotification({
      userId: user.id,
      title: 'Test',
      message: 'Ini test message',
    });
    console.log(result);
    // expect().toBeDefined()
  });

  it('GET /api/notifications', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/notifications')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.length).toBe(3);
    expect(response.body[0].message).toBe('Test message 1');
  });

  it('GET /api/notifications/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/notifications/${notifications[0].id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/notifications/:id (Read single notification)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/notifications/${notifications[0].id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/notifications/:id (Read all notifications)', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/notifications`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('DELETE /api/notifications/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/notifications/${notifications[0].id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('DELETE /api/notifications (Delete All)', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/notifications`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteNotifications();
    await testService.deleteUser();
  });
});
