import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';
import { ApprovalType, PaymentStatus } from '@prisma/client';

describe('PaymentAuthorizationsController', () => {
  let app: INestApplication;
  let testService: TestService;
  let paymentAuthorization;
  let token;
  let users = [];
  let company;
  let bank;

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
    bank = await testService.createBank();
    const user1 = await testService.createDummyUser('user1');
    const user2 = await testService.createDummyUser('user2');
    const user3 = await testService.createDummyUser('user3');
    users.push(user1, user2, user3);
  });

  it('POST /api/payment-authorizations', async () => {
    // bikin approval setting dulu
    const { body: approvalSetting } = await request(app.getHttpServer())
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

    console.log(approvalSetting);

    const response = await request(app.getHttpServer())
      .post('/api/payment-authorizations')
      .send({
        companyId: company.id,
        employeeId: users[0].id,
        bankId: bank.id,
        bankAccount: '2411191***',
        grossAmount: 2_000_000,
        deduction: 0,
        netAmount: 2_000_000,
        amount: 2_000_000,
        cashAdvance: 0,
        description: 'Cash Advance for Bagas for 3 days',
        status: PaymentStatus.DRAFT,
        items: [
          {
            date: new Date('2024-07-19'),
            description: 'Cash Advance for Bagas for 3 days',
            amount: 2_000_000,
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    paymentAuthorization = response.body;
    console.log(paymentAuthorization);
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.description).toBe('Cash Advance for Bagas for 3 days');
    expect(response.body.netAmount).toBe(2_000_000);
  });

  it('GET /api/payment-authorizations', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/payment-authorizations')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/payment-authorizations/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/payment-authorizations/${paymentAuthorization.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/payment-authorizations/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/payment-authorizations/${paymentAuthorization.id}`)
      .send({
        companyId: company.id,
        employeeId: users[0].id,
        bankId: bank.id,
        bankAccount: '2411191***',
        grossAmount: 3_000_000,
        deduction: 0,
        netAmount: 3_000_000,
        amount: 3_000_000,
        cashAdvance: 0,
        description: 'Cash Advance for Bagas for 4 days',
        status: PaymentStatus.DRAFT,
        items: [
          {
            date: new Date('2024-07-20'),
            description: 'Cash Advance for Bagas for 4 days',
            amount: 3_000_000,
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    console.log(response.body);
    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.description).toBe('Cash Advance for Bagas for 4 days');
    expect(response.body.netAmount).toBe(3_000_000);
  });

  it('DELETE /api/payment-authorizations/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/payment-authorizations/${paymentAuthorization.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deletePaymentAuthorizations();
    await testService.deleteApprovalSettings();
    await testService.deleteCompanies();
    await testService.deleteBanks();
    await testService.deleteUser();
  });
});
