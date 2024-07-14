import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class BanksService {
  constructor(private prisma: PrismaService) {}

  create(createBankDto: CreateBankDto) {
    return this.prisma.bank.create({
      data: createBankDto,
    });
  }

  findAll() {
    return this.prisma.bank.findMany({
      orderBy: {
        code: 'asc',
        name: 'asc',
      },
    });
  }

  findOne(id: number) {
    return this.prisma.bank.findUnique({ where: { id } });
  }

  update(id: number, updateBankDto: UpdateBankDto) {
    return this.prisma.bank.update({
      data: updateBankDto,
      where: { id },
    });
  }

  remove(id: number) {
    return this.prisma.bank.delete({ where: { id } });
  }
}
