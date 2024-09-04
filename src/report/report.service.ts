import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const pendingRequest = await this.prisma.paymentAuthorization.count({
      where: {
        status: { not: 'DRAFT' },
      },
    });

    const pendingApprovalCount =
      await this.prisma.paymentAuthorizationApproval.count({
        where: { userId, approvalStatus: null },
      });

    return {
      pendingRequest,
      pendingApprovalCount,
    };
  }
}
