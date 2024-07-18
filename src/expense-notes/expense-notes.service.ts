import { Injectable } from '@nestjs/common';
import { ExpenseNoteDto } from './dto/expense-note.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExpenseNotesService {
  constructor(private prisma: PrismaService) {}

  create(expenseNoteDto: ExpenseNoteDto) {
    return this.prisma.expenseNote.create({ data: expenseNoteDto });
  }

  findAll() {
    return this.prisma.expenseNote.findMany();
  }

  findOne(id: number) {
    return this.prisma.expenseNote.findUniqueOrThrow({ where: { id } });
  }

  update(id: number, expenseNoteDto: ExpenseNoteDto) {
    return this.prisma.expenseNote.update({
      data: expenseNoteDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.expenseNote.delete({ where: { id } });
  }
}
