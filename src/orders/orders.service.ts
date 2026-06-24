import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto } from './dto/order.dto';
import { Prisma } from '../prisma/client/client';

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
}
