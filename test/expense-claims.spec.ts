import { HttpStatus, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';
import { TestModule } from './test.module';
import { TestService } from './test.service';
import { ApprovalType, ClaimStatus, PaymentStatus } from '@prisma/client';

describe('ExpenseClaimsController', () => {
  let app: INestApplication;
  let testService: TestService;
  let expenseClaim;
  let token;
  let users = [];
  let company;
  let bank;
  let department;
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

    // create master data
    company = await testService.createCompany();
    bank = await testService.createBank();
    department = await testService.createDepartment();
    expenseType = await testService.createExpenseType();
    const user1 = await testService.createDummyUser('user1');
    const user2 = await testService.createDummyUser('user2');
    const user3 = await testService.createDummyUser('user3');
    users.push(user1, user2, user3);
  });

  it('POST /api/expense-claims', async () => {
    // bikin approval setting dulu
    const { body: approvalSetting } = await request(app.getHttpServer())
      .post('/api/approval-settings')
      .send({
        companyId: company.id,
        approvalType: ApprovalType.EXPENSE_CLAIM,
        items: [
          {
            userId: users[0].id,
            level: 1,
            approvalActionType: 'APPROVAL',
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    const response = await request(app.getHttpServer())
      .post('/api/expense-claims')
      .send({
        departmentId: department.id,
        totalAmount: 2_000_000,
        cashAdvance: 1_000_000,
        claim: 1_000_000,
        status: ClaimStatus.DRAFT,
        companyId: company.id,
        items: [
          {
            date: '2024-07-01T00:00:00.000Z',
            expenseTypeId: expenseType.id,
            description: 'BBM Pertamax 150 Liter',
            amount: 2_000_000,
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    expenseClaim = response.body;
    expect(response.statusCode).toBe(HttpStatus.CREATED);
    expect(response.body.totalAmount).toBe(2_000_000);
    expect(response.body.cashAdvance).toBe(1_000_000);
    expect(response.body.claim).toBe(1_000_000);
  });

  it('GET /api/expense-claims', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/expense-claims')
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('GET /api/expense-claims/:id', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/expense-claims/${expenseClaim.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('PATCH /api/expense-claims/:id', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/api/expense-claims/${expenseClaim.id}`)
      .send({
        departmentId: department.id,
        totalAmount: 3_000_000,
        cashAdvance: 1_500_000,
        claim: 1_500_000,
        status: ClaimStatus.DRAFT,
        companyId: company.id,
        items: [
          {
            date: new Date(),
            expenseTypeId: expenseType.id,
            description: 'BBM Pertamax 300 Liter',
            amount: 3_000_000,
          },
        ],
      })
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
    expect(response.body.totalAmount).toBe(3_000_000);
    expect(response.body.cashAdvance).toBe(1_500_000);
    expect(response.body.claim).toBe(1_500_000);
  });

  it('DELETE /api/expense-claims/:id', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/api/expense-claims/${expenseClaim.id}`)
      .auth(token, { type: 'bearer' });

    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  afterAll(async () => {
    await testService.deleteExpenseClaims();
    await testService.deleteApprovalSettings();
    await testService.deleteCompanies();
    await testService.deleteBanks();
    await testService.deleteDepartments();
    await testService.deleteUser();
  });
});
