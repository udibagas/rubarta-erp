import { PrismaService } from './../prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExpenseClaimDto } from './expense-claim.dto';
import { ClaimStatus, Prisma } from '@prisma/client';

@Injectable()
export class ExpenseClaimsService {
  constructor(private prisma: PrismaService) {}

  create(expenseClaimDto: ExpenseClaimDto) {
    const {
      ExpenseClaimItem: items,
      ExpenseClaimAttachment: attachments,
      ...data
    } = expenseClaimDto;

    return this.prisma.expenseClaim.create({
      data: {
        ...data,
        ExpenseClaimItem: { create: items },
        ExpenseClaimAttachment: { create: attachments },
      },
      include: {
        ExpenseClaimItem: true,
        ExpenseClaimAttachment: true,
      },
    });
  }

  async findAll(params: {
    pageSize?: number;
    page?: number;
    companyId?: number;
    keyword?: string;
  }) {
    const { page, pageSize, keyword, companyId } = params;
    const where: Prisma.ExpenseClaimWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (keyword) {
      // TODO: tambahin searching
    }

    const data = await this.prisma.expenseClaim.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
      include: {
        Department: { select: { name: true } },
        User: { select: { name: true } },
        Company: { select: { name: true } },
      },
    });

    const total = await this.prisma.expenseClaim.count({ where });
    return { data, page, total };
  }

  findOne(id: number) {
    return this.prisma.expenseClaim.findUniqueOrThrow({
      where: { id },
      include: {
        Department: { select: { name: true } },
        User: { select: { name: true } },
        Company: { select: { name: true } },
        ExpenseClaimItem: {
          include: { ExpenseType: true },
        },
        ExpenseClaimAttachment: true,
        ExpenseClaimApproval: {
          include: {
            User: { select: { name: true } },
          },
        },
      },
    });
  }

  update(id: number, expenseClaimDto: ExpenseClaimDto) {
    const {
      ExpenseClaimItem: items,
      ExpenseClaimAttachment: attachments,
      ...data
    } = expenseClaimDto;
    return this.prisma.expenseClaim.update({
      data: {
        ...data,
        ExpenseClaimItem: {
          deleteMany: {}, // hapus semua data item untuk di create lagi
          create: items,
        },
        ExpenseClaimAttachment: {
          deleteMany: {},
          create: attachments,
        },
      },
      where: { id },
      include: {
        ExpenseClaimItem: true,
      },
    });
  }

  remove(id: number) {
    return this.prisma.expenseClaim.delete({ where: { id } });
  }

  async removeItem(id: number, itemId: number) {
    const data = await this.findOne(id);
    if (data.status !== ClaimStatus.DRAFT) throw new ForbiddenException();

    return this.prisma.expenseClaimItem.delete({
      where: {
        id: itemId,
        expenseClaimId: id,
      },
    });
  }

  async approve(id: number) {
    // TODO: cari status approval

    const savedData = await this.prisma.expenseClaim.update({
      data: {
        status: ClaimStatus.FULLY_APPROVED,
      },
      where: { id },
    });

    // todo: emit event

    return savedData;
  }

  reject(id: number) {
    return this.prisma.expenseClaim.update({
      data: {
        status: ClaimStatus.REJECTED,
      },
      where: { id },
    });
  }
}
