import { Injectable } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { SupplierDto } from './supplier.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Supplier[]> {
    return this.prisma.supplier.findMany({
      include: { Bank: true },
    });
  }

  findOne(id: number): Promise<Supplier> {
    return this.prisma.supplier.findUniqueOrThrow({ where: { id } });
  }

  async create(data: SupplierDto): Promise<Supplier> {
    data.code = await this.generateCode();
    return this.prisma.supplier.create({ data });
  }

  update(id: number, data: SupplierDto): Promise<Supplier> {
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
