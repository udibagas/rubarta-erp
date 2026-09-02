import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto } from './dto/order.dto';
import { Prisma } from '../prisma/client/client';
import fs from 'fs';
import { PDFParse } from 'pdf-parse';

interface PurchaseOrderItem {
  lineNo: number;
  manufacturer: string;
  vendorPartNo: string;
  description: string;
  tariffCode: string | null;

  quantity: number;
  unit: string;

  unitPrice: number;
  discountPercent: number;
  netUnitPrice: number;
  netAmount: number;
  weight: number;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateOrderDto) {
    const { items, ...orderData } = data;

    // Calculate totals
    let totalAmount = 0;
    let vatAmount = 0;

    const processedItems = items.map((item) => {
      const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
      totalAmount += itemTotal;

      if (item.vat) {
        const itemVat = itemTotal * 0.11; // 11% VAT
        vatAmount += itemVat;
      }

      return {
        ...item,
        totalPrice: itemTotal,
      };
    });

    const discount = orderData.discount || 0;
    totalAmount -= discount;
    const grandTotal = totalAmount + vatAmount;

    return this.prisma.order.create({
      data: {
        ...orderData,
        totalAmount,
        vatAmount,
        grandTotal,
        OrderItems: {
          create: processedItems,
        },
      },
      include: {
        OrderItems: true,
        Customer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query: QueryOrderDto) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        _count: {
          select: { OrderItems: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        OrderItems: {
          orderBy: { sortOrder: 'asc' },
        },
        Customer: true,
        Invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: number, data: UpdateOrderDto) {
    await this.findOne(id); // Verify exists

    const { items, ...orderData } = data;

    // If items are provided, recalculate totals
    if (items) {
      let totalAmount = 0;
      let vatAmount = 0;

      const processedItems = items.map((item) => {
        const itemTotal = item.quantity * item.unitPrice - (item.discount || 0);
        totalAmount += itemTotal;

        if (item.vat) {
          const itemVat = itemTotal * 0.11;
          vatAmount += itemVat;
        }

        return {
          ...item,
          totalPrice: itemTotal,
        };
      });

      const discount = orderData.discount || 0;
      totalAmount -= discount;
      const grandTotal = totalAmount + vatAmount;

      // Delete existing items and create new ones
      await this.prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      return this.prisma.order.update({
        where: { id },
        data: {
          ...orderData,
          totalAmount,
          vatAmount,
          grandTotal,
          OrderItems: {
            create: processedItems,
          },
        },
        include: {
          OrderItems: true,
          Customer: { select: { id: true, name: true } },
        },
      });
    }

    return this.prisma.order.update({
      where: { id },
      data: orderData,
      include: {
        OrderItems: true,
        Customer: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify exists

    // Soft delete
    return this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async parsePo() {
    const buffer = fs.readFileSync('./po.pdf');
    const uint8Array = new Uint8Array(buffer);
    const parser = new PDFParse(uint8Array);
    const result = await parser.getText();

    const regex = /Page \d+\/\d+/;

    const pages = result.text.split(/-- \d+ of \d+ --/);

    const lines = [];

    let i = 0;
    for (const page of pages) {
      const pageLines = page
        .split('\n')
        .filter((item) => !regex.test(item))
        .slice(i > 0 ? 38 : 36)
        .map((line) => line.trim().replace(/\t/g, '==='))
        .filter((line) => line.length > 0);
      lines.push(...pageLines);
      i++;
    }

    return lines;
  }
}
