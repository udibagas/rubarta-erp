import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const nkpDraft = await this.prisma.nkp.count({
      where: { status: 'DRAFT' },
    });

    const nkpClosed = await this.prisma.nkp.count({
      where: { status: 'CLOSED' },
    });

    const nkpOpen = await this.prisma.nkp.count({
      where: { status: { notIn: ['CLOSED', 'DRAFT'] } },
    });

    const pendingApprovalCount = await this.prisma.nkpApproval.count({
      where: { userId, approvalStatus: null },
    });

    return {
      nkpDraft,
      nkpClosed,
      nkpOpen,
      pendingApprovalCount,
    };
  }
}
