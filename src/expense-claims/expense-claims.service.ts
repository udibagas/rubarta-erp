import { PrismaService } from './../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateExpenseClaimDto } from './dto/create-expense-claim.dto';
import { UpdateExpenseClaimDto } from './dto/update-expense-claim.dto';

@Injectable()
export class ExpenseClaimsService {
  constructor(private prisma: PrismaService) {}

  create(createExpenseClaimDto: CreateExpenseClaimDto) {
    return this.prisma.expenseClaim.create({
      data: createExpenseClaimDto,
    });
  }

  findAll() {
    return this.prisma.expenseClaim.findMany();
  }

  findOne(id: number) {
    return this.prisma.expenseClaim.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, updateExpenseClaimDto: UpdateExpenseClaimDto) {
    return this.prisma.expenseClaim.update({
      data: updateExpenseClaimDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.expenseClaim.delete({ where: { id } });
  }
}
