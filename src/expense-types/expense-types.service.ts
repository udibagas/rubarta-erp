import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateExpenseTypeDto } from './dto/create-expense-type.dto';
import { UpdateExpenseTypeDto } from './dto/update-expense-type.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ExpenseTypesService {
  constructor(private prisma: PrismaService) {}

  create(createExpenseTypeDto: CreateExpenseTypeDto) {
    return this.prisma.expenseType.create({ data: createExpenseTypeDto });
  }

  findAll() {
    return this.prisma.expenseType.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const data = await this.prisma.expenseType.findUnique({ where: { id } });
    if (!data) throw new NotFoundException();
    return data;
  }

  async update(id: number, updateExpenseTypeDto: UpdateExpenseTypeDto) {
    await this.findOne(id);
    return this.prisma.expenseType.update({
      data: updateExpenseTypeDto,
      where: { id },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.expenseType.delete({ where: { id } });
  }
}
