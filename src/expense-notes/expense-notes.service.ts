import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExpenseNoteDto } from './dto/expense-note.dto';
import * as fs from 'node:fs/promises';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExpenseNotesService {
  constructor(private prisma: PrismaService) {}

  create(data: ExpenseNoteDto) {
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

  update(id: number, data: ExpenseNoteDto) {
    return this.prisma.expenseNote.update({
      data,
      where: { id },
    });
  }

  async remove(id: number) {
    const data = await this.findOne(id);

    if (data.attachment) {
      const attachment = data.attachment as { filePath: string };
      await fs.unlink(attachment.filePath);
    }

    return this.prisma.expenseNote.delete({ where: { id } });
  }
}
