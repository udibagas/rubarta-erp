import { PrismaService } from './../prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { ExpenseClaimDto } from './dto/expense-claim.dto';
import { ClaimStatus, Prisma } from '@prisma/client';

@Injectable()
export class ExpenseClaimsService {
  constructor(private prisma: PrismaService) {}

  create(expenseClaimDto: ExpenseClaimDto) {
    const { items, ...data } = expenseClaimDto;
    return this.prisma.expenseClaim.create({
      data: {
        ...data,
        ExpenseClaimItem: {
          create: items,
        },
      },
      include: {
        ExpenseClaimItem: true,
        ExpenseClaimAttachment: true,
      },
    });
  }

  findAll(params: {
    take?: number;
    skip?: number;
    cursor?: Prisma.ExpenseClaimWhereUniqueInput;
    where?: Prisma.ExpenseClaimWhereInput;
    orderBy?: Prisma.ExpenseClaimOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.expenseClaim.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: { ExpenseClaimItem: true },
    });
  }

  findOne(id: number) {
    return this.prisma.expenseClaim.findUniqueOrThrow({
      where: { id },
      include: {
        ExpenseClaimItem: true,
        ExpenseClaimAttachment: true,
        ExpenseClaimApproval: true,
      },
    });
  }

  update(id: number, expenseClaimDto: ExpenseClaimDto) {
    const { items, ...data } = expenseClaimDto;
    return this.prisma.expenseClaim.update({
      data: {
        ...data,
        ExpenseClaimItem: {
          deleteMany: {}, // hapus semua data item untuk di create lagi
          create: items,
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
        status: ClaimStatus.APPROVED,
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
