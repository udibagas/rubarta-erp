import { Injectable } from '@nestjs/common';
import { Supplier } from '@prisma/client';
import { SupplierDto } from './supplier.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SuppliersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Supplier[]> {
    return this.prisma.supplier.findMany();
  }

  async findOne(id: number): Promise<Supplier> {
    return this.prisma.supplier.findUniqueOrThrow({
      where: { id },
    });
  }

  async create(data: SupplierDto): Promise<Supplier> {
    return this.prisma.supplier.create({
      data,
    });
  }

  async update(id: number, data: SupplierDto): Promise<Supplier> {
    return this.prisma.supplier.update({
      where: { id },
      data,
    });
  }

  async remove(id: number): Promise<Supplier> {
    return this.prisma.supplier.delete({
      where: { id },
    });
  }
}
