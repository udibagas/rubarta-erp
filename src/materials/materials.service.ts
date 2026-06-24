import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  QueryMaterialDto,
} from './dto/material.dto';
import { Prisma } from '../prisma/client/client';

@Injectable()
export class MaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateMaterialDto) {
    // Check if part number already exists
    const existing = await this.prisma.material.findUnique({
      where: { partNumber: data.partNumber },
    });

    if (existing) {
      throw new ConflictException(
        `Material with part number ${data.partNumber} already exists`,
      );
    }

    return this.prisma.material.create({
      data,
      include: {
        Supplier: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: QueryMaterialDto) {
    const where: Prisma.MaterialWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.OR = [
        { partNumber: { contains: query.keyword, mode: 'insensitive' } },
        { name: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Note: lowStock filter is applied after fetching
    // because Prisma doesn't support field-to-field comparison in where clause
    let materials = await this.prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        Supplier: { select: { id: true, name: true } },
      },
    });

    // Filter low stock materials in memory
    if (query.lowStock) {
      materials = materials.filter(
        (m) =>
          m.currentStock !== null &&
          m.minStock !== null &&
          m.currentStock <= m.minStock,
      );
    }

    return materials;
  }

  async findOne(id: number) {
    const material = await this.prisma.material.findFirst({
      where: { id, deletedAt: null },
      include: {
        Supplier: true,
      },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${id} not found`);
    }

    return material;
  }

  async findByPartNumber(partNumber: string) {
    const material = await this.prisma.material.findFirst({
      where: { partNumber, deletedAt: null },
      include: {
        Supplier: true,
      },
    });

    if (!material) {
      throw new NotFoundException(
        `Material with part number ${partNumber} not found`,
      );
    }

    return material;
  }

  async update(id: number, data: UpdateMaterialDto) {
    await this.findOne(id); // Verify exists

    // If updating part number, check for conflicts
    if (data.partNumber) {
      const existing = await this.prisma.material.findFirst({
        where: {
          partNumber: data.partNumber,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Material with part number ${data.partNumber} already exists`,
        );
      }
    }

    return this.prisma.material.update({
      where: { id },
      data,
      include: {
        Supplier: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify exists

    // Soft delete
    return this.prisma.material.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Additional method for stock management
  async updateStock(id: number, quantity: number) {
    const material = await this.findOne(id);

    return this.prisma.material.update({
      where: { id },
      data: {
        currentStock: material.currentStock + quantity,
      },
    });
  }
}
