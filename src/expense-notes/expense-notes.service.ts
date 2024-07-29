import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseNotesService {
  constructor(private prisma: PrismaService) {}

  create(data) {
    return this.prisma.expenseNote.create({ data });
  }

  findAll(userId: number) {
    return this.prisma.expenseNote.findMany({
      where: { userId },
      include: { expenseType: true },
      orderBy: { date: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.expenseNote.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, data) {
    return this.prisma.expenseNote.update({
      data,
      where: { id },
    });
  }

  remove(id: number) {
    // TODO: hapus attachments
    return this.prisma.expenseNote.delete({ where: { id } });
  }
}
