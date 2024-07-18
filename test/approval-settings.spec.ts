import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';
import { ApprovalType } from '@prisma/client';

describe('ApprovalSettingController', () => {
  let app: INestApplication;
  let testService: TestService;
  let approvalSetting;
  let token;
  let users = [];
  let company;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    testService = app.get(TestService);
    await testService.createUser();
    token = testService.createToken();

    // create master data
    company = await testService.createCompany();
    const user1 = await testService.createDummyUser('user1');
    const user2 = await testService.createDummyUser('user2');
    const user3 = await testService.createDummyUser('user3');
    users.push(user1, user2, user3);
  });

  it('POST /api/approval-settings', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/approval-settings')
      .send({
        companyId: company.id,
        approvalType: ApprovalType.PAYMENT_AUTHORIZATION,
        items: [
          {
            userId: users[0].id,
            level: 1,
            approvalActionType: 'APPROVAL',
          },
          {
            userId: users[1].id,
            level: 2,
            approvalActionType: 'VERIFICATION',
          },
          {
            userId: users[2].id,
            level: 3,
            approvalActionType: 'PAYMENT',
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    approvalSetting = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
  });

  it('GET /api/approval-settings', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/approval-settings')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/approval-settings/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/approval-settings/${approvalSetting.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/approval-settings/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/approval-settings/${approvalSetting.id}`)
      .send({
        companyId: company.id,
        approvalType: ApprovalType.EXPENSE_CLAIM,
        items: [
          {
            userId: users[2].id,
            level: 1,
            approvalActionType: 'APPROVAL',
          },
          {
            userId: users[0].id,
            level: 2,
            approvalActionType: 'VERIFICATION',
          },
          {
            userId: users[1].id,
            level: 3,
            approvalActionType: 'PAYMENT',
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.approvalType).toBe(ApprovalType.EXPENSE_CLAIM);
  });

  it('DELETE /api/approval-settings/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/approval-settings/${approvalSetting.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteApprovalSettings();
    await testService.deleteCompanies();
    await testService.deleteUser();
  });
});
