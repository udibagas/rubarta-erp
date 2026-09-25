import { Injectable } from '@nestjs/common';
import { Supplier } from '../prisma/client/client';
import { CreateSupplierDto, UpdateSupplierDto, QuerySupplierDto } from './supplier.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '../prisma/client/client';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySupplierDto): Promise<Supplier[] | { data: Supplier[]; total: number }> {

    const where: Prisma.SupplierWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { code: { contains: query.keyword, mode: 'insensitive' } },
        { address: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const take = query.pageSize ? parseInt(query.pageSize) : undefined;
    const skip = query.page ? (parseInt(query.page) - 1) * take : undefined;

    const data = await this.prisma.supplier.findMany({
      where,
      take,
      skip,
      include: { Bank: true },
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.supplier.count({ where })
      return { data, total };
    }


    return data;
  }

  findOne(id: number): Promise<Supplier> {
    return this.prisma.supplier.findUniqueOrThrow({ where: { id } });
  }

  async create(data: CreateSupplierDto): Promise<Supplier> {
    data.code = await this.generateCode();
    return this.prisma.supplier.create({ data });
  }

  update(id: number, data: UpdateSupplierDto): Promise<Supplier> {
    return this.prisma.supplier.update({ where: { id }, data });
  }

  remove(id: number): Promise<Supplier> {
    return this.prisma.supplier.delete({ where: { id } });
  }

  async generateCode(): Promise<string> {
    let code = '100001';

    const lastData = await this.prisma.supplier.findFirst({
      orderBy: { code: 'desc' },
    });

    if (lastData) code = (Number(lastData.code) + 1).toString();
    return code;
  }
}
