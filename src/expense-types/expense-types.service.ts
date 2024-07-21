import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseTypeDto } from './expense-type.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseTypesService {
  constructor(private prisma: PrismaService) {}

  create(expenseTypeDto: ExpenseTypeDto) {
    return this.prisma.expenseType.create({ data: expenseTypeDto });
  }

  findAll() {
    return this.prisma.expenseType.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: number) {
    return this.prisma.expenseType.findUnique({ where: { id } });
  }

  update(id: number, expenseTypeDto: ExpenseTypeDto) {
    return this.prisma.expenseType.update({
      data: expenseTypeDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.expenseType.delete({ where: { id } });
  }
}
