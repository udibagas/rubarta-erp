import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateExpenseDto) {
    return this.prisma.expense.create({
      data: { ...data, date: new Date(data.date) },
    });
  }

  findAll() {
    return this.prisma.expense.findMany({ orderBy: { date: 'desc' } });
  }

  findOne(id: number) {
    return this.prisma.expense.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, data: UpdateExpenseDto) {
    return this.prisma.expense.update({
      where: { id },
      data: {
        ...data,
        ...(data.date === undefined ? {} : { date: new Date(data.date) }),
      },
    });
  }

  remove(id: number) {
    return this.prisma.expense.delete({ where: { id } });
  }
}
