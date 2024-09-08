import { Injectable } from '@nestjs/common';
import { Customer, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CustomerDto } from './customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { keyword: string }): Promise<Customer[]> {
    const { keyword } = params;
    const where: Prisma.CustomerWhereInput = {};

    if (keyword) {
      where.name = { contains: keyword, mode: 'insensitive' };
    }

    return this.prisma.customer.findMany({ where, orderBy: { name: 'asc' } });
  }

  async findOne(id: number): Promise<Customer> {
    return this.prisma.customer.findUnique({
      where: { id },
    });
  }

  async create(data: CustomerDto): Promise<Customer> {
    return this.prisma.customer.create({ data });
  }

  async update(id: number, data: CustomerDto): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<Customer> {
    return this.prisma.customer.delete({
      where: { id },
    });
  }
}
