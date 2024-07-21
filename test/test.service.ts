import { Injectable } from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import { NotificationsService } from '../src/notifications/notifications.service';

@Injectable()
export class TestService {
  private user;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationsService,
  ) {}

  async createUser() {
    const password = await bcrypt.hash('password', 10);
    const user = await this.prisma.user.create({
      data: {
        name: 'Bagas Udi Sahsangka',
        email: 'udibagas@gmail.com',
        password: password,
        roles: ['ADMIN'],
      },
    });

    this.user = user;
    return user;
  }

  createToken() {
    const { id: sub, name, roles, email } = this.user;
    const payload = { sub, name, email, roles };
    const token = this.jwtService.sign(payload);
    return token;
  }

  async createDummyUser(name, roles = [Role.USER]) {
    const password = await bcrypt.hash('password', 10);
    return this.prisma.user.create({
      data: {
        name: name,
        email: `${name}@mail.com`,
        password: password,
        roles: roles,
      },
    });
  }

  createCompany() {
    return this.prisma.company.create({
      data: {
        code: 'RPA',
        name: 'PT Rubarta Prima Abadi',
      },
    });
  }

  createDepartment() {
    return this.prisma.department.create({
      data: {
        code: 'OPS',
        name: 'Operational',
      },
    });
  }

  createBank() {
    return this.prisma.bank.create({
      data: {
        code: 'BCA',
        name: 'Bank Central Asia',
      },
    });
  }

  createExpenseType() {
    return this.prisma.expenseType.create({
      data: {
        name: 'FUEL',
      },
    });
  }

  deleteUser() {
    return this.prisma.user.deleteMany({});
  }

  deleteBanks() {
    return this.prisma.bank.deleteMany({});
  }

  deleteCompanies() {
    return this.prisma.company.deleteMany({});
  }

  deleteDepartments() {
    return this.prisma.department.deleteMany({});
  }

  deleteExpenseTypes() {
    return this.prisma.expenseType.deleteMany({});
  }

  deleteApprovalSettings() {
    return this.prisma.approvalSetting.deleteMany({});
  }

  deleteExpenseNotes() {
    return this.prisma.expenseNote.deleteMany({});
  }

  deletePaymentAuthorizations() {
    return this.prisma.paymentAuthorization.deleteMany({});
  }

  deleteExpenseClaims() {
    return this.prisma.expenseClaim.deleteMany({});
  }

  createNotification(userId) {
    return this.prisma.notification.createManyAndReturn({
      data: [
        {
          userId,
          title: 'Test',
          message: 'Test message 1',
        },
        {
          userId,
          title: 'Test',
          message: 'Test message 2',
        },
        {
          userId,
          title: 'Test',
          message: 'Test message 3',
        },
      ],
    });
  }

  deleteNotifications() {
    return this.prisma.notification.deleteMany({});
  }

  sendNotification(notification) {
    return this.notificationService.send(notification);
  }
}
