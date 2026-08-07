import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  QueryMaterialDto,
} from './dto/material.dto';
import { Prisma } from '../prisma/client/client';
import * as ExcelJS from 'exceljs';

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

  async exportToExcel(query: QueryMaterialDto): Promise<Buffer> {
    const materials = await this.findAll(query);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Materials');

    // Define columns
    worksheet.columns = [
      { header: 'Part Number', key: 'partNumber', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Unit', key: 'unit', width: 10 },
      { header: 'Weight', key: 'weight', width: 10 },
      { header: 'Purchase Currency', key: 'purchaseCurrency', width: 15 },
      { header: 'Selling Currency', key: 'sellingCurrency', width: 15 },
      { header: 'Purchase Price', key: 'purchasePrice', width: 15 },
      { header: 'Selling Price', key: 'sellingPrice', width: 15 },
      { header: 'Min Stock', key: 'minStock', width: 10 },
      { header: 'Current Stock', key: 'currentStock', width: 12 },
      { header: 'Supplier Name', key: 'supplierName', width: 25 },
      { header: 'Lead Time (days)', key: 'leadTime', width: 12 },
      { header: 'Is Active', key: 'isActive', width: 10 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Add data rows
    materials.forEach((material) => {
      worksheet.addRow({
        partNumber: material.partNumber,
        name: material.name,
        model: material.model,
        description: material.description,
        category: material.category,
        unit: material.unit,
        weight: material.weight,
        purchaseCurrency: material.purchaseCurrency,
        sellingCurrency: material.sellingCurrency,
        purchasePrice: material.purchasePrice,
        sellingPrice: material.sellingPrice,
        minStock: material.minStock,
        currentStock: material.currentStock,
        supplierName: material.Supplier?.name,
        leadTime: material.leadTime,
        isActive: material.isActive,
      });
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: 'A1',
      to: `P1`,
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importFromExcel(buffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const worksheet = workbook.getWorksheet('Materials');
    if (!worksheet) {
      throw new BadRequestException(
        'Invalid Excel file: "Materials" worksheet not found',
      );
    }

    const materials: any[] = [];
    const errors: string[] = [];

    // Skip header row (row 1)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const partNumber = row.getCell(1).value?.toString();
        const name = row.getCell(2).value?.toString();
        const unit = row.getCell(6).value?.toString();

        if (!partNumber || !name || !unit) {
          errors.push(
            `Row ${rowNumber}: Missing required fields (Part Number, Name, or Unit)`,
          );
          return;
        }

        const material: any = {
          partNumber,
          name,
          model: row.getCell(3).value?.toString() || null,
          description: row.getCell(4).value?.toString() || null,
          category: row.getCell(5).value?.toString() || null,
          unit,
          weight: row.getCell(7).value
            ? parseFloat(row.getCell(7).value.toString())
            : null,
          purchaseCurrency: row.getCell(8).value?.toString() || null,
          sellingCurrency: row.getCell(9).value?.toString() || null,
          purchasePrice: row.getCell(10).value
            ? parseFloat(row.getCell(10).value.toString())
            : null,
          sellingPrice: row.getCell(11).value
            ? parseFloat(row.getCell(11).value.toString())
            : null,
          minStock: row.getCell(12).value
            ? parseInt(row.getCell(12).value.toString())
            : 0,
          currentStock: row.getCell(13).value
            ? parseInt(row.getCell(13).value.toString())
            : 0,
          leadTime: row.getCell(15).value
            ? parseInt(row.getCell(15).value.toString())
            : null,
          isActive: row.getCell(16).value
            ? row.getCell(16).value.toString().toLowerCase() === 'true'
            : true,
        };

        // Handle supplier by name (if provided in column 14)
        const supplierName = row.getCell(14).value?.toString();
        if (supplierName) {
          // Store supplier name temporarily, will be resolved later
          material.supplierName = supplierName;
        }

        materials.push(material);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Invalid data format';
        errors.push(`Row ${rowNumber}: ${errorMessage}`);
      }
    });

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Import failed with errors',
        errors,
      });
    }

    if (materials.length === 0) {
      throw new BadRequestException('No valid data found in Excel file');
    }

    // Get all suppliers for mapping
    const suppliers = await this.prisma.supplier.findMany();

    const supplierMap = new Map(
      suppliers.map((s) => [s.name.toLowerCase(), s.id]),
    );

    // Resolve supplier IDs and create materials
    const created = [];
    const skipped = [];

    for (const material of materials) {
      try {
        // Check if material already exists
        const existing = await this.prisma.material.findFirst({
          where: { partNumber: material.partNumber, deletedAt: null },
        });

        if (existing) {
          skipped.push({
            partNumber: material.partNumber,
            reason: 'Already exists',
          });
          continue;
        }

        // Resolve supplier ID
        if (material.supplierName) {
          const supplierId = supplierMap.get(
            material.supplierName.toLowerCase(),
          );
          if (supplierId) {
            material.supplierId = supplierId;
          }
          delete material.supplierName;
        }

        const newMaterial = await this.prisma.material.create({
          data: material,
        });

        created.push(newMaterial);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to create';
        skipped.push({
          partNumber: material.partNumber,
          reason: errorMessage,
        });
      }
    }

    return {
      message: 'Import completed',
      created: created.length,
      skipped: skipped.length,
      details: {
        created: created.map((m) => ({
          partNumber: m.partNumber,
          name: m.name,
        })),
        skipped,
      },
    };
  }

  async generateTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Materials');

    // Define columns
    worksheet.columns = [
      { header: 'Part Number *', key: 'partNumber', width: 15 },
      { header: 'Name *', key: 'name', width: 30 },
      { header: 'Model', key: 'model', width: 15 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Category', key: 'category', width: 15 },
      { header: 'Unit *', key: 'unit', width: 10 },
      { header: 'Weight', key: 'weight', width: 10 },
      { header: 'Purchase Currency', key: 'purchaseCurrency', width: 15 },
      { header: 'Selling Currency', key: 'sellingCurrency', width: 15 },
      { header: 'Purchase Price', key: 'purchasePrice', width: 15 },
      { header: 'Selling Price', key: 'sellingPrice', width: 15 },
      { header: 'Min Stock', key: 'minStock', width: 10 },
      { header: 'Current Stock', key: 'currentStock', width: 12 },
      { header: 'Supplier Name', key: 'supplierName', width: 25 },
      { header: 'Lead Time (days)', key: 'leadTime', width: 12 },
      { header: 'Is Active', key: 'isActive', width: 10 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add sample data
    worksheet.addRow({
      partNumber: 'PART-001',
      name: 'Sample Material',
      model: 'MODEL-A',
      description: 'Sample description',
      category: 'Raw Materials',
      unit: 'pcs',
      weight: 1.5,
      purchaseCurrency: 'USD',
      sellingCurrency: 'USD',
      purchasePrice: 100,
      sellingPrice: 150,
      minStock: 10,
      currentStock: 100,
      supplierName: 'Sample Supplier',
      leadTime: 7,
      isActive: true,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
