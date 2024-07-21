import { Injectable, NotFoundException } from '@nestjs/common';
import { BankDto } from './bank.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  create(bankDto: BankDto) {
    return this.prisma.bank.create({
      data: bankDto,
    });
  }

  findAll() {
    return this.prisma.bank.findMany({
      orderBy: { code: 'asc' },
    });
  }

  findOne(id: number) {
    return this.prisma.bank.findUnique({ where: { id } });
  }

  update(id: number, bankDto: BankDto) {
    return this.prisma.bank.update({
      data: bankDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.bank.delete({ where: { id } });
  }
}
