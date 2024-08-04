import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const expenseClaimCount = await this.prisma.expenseClaim.count({
      where: {
        status: { not: 'DRAFT' },
      },
    });

    const paymentAuthorizationCount =
      await this.prisma.paymentAuthorization.count({
        where: {
          status: { not: 'DRAFT' },
        },
      });

    let pendingApprovalCount =
      await this.prisma.paymentAuthorizationApproval.count({
        where: { userId, approvalStatus: null },
      });

    pendingApprovalCount += await this.prisma.expenseClaimApproval.count({
      where: { userId, approvalStatus: null },
    });

    return {
      expenseClaimCount,
      paymentAuthorizationCount,
      pendingApprovalCount,
    };
  }
}
