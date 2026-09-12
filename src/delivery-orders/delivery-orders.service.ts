import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDeliveryOrderDto,
  QueryDeliveryOrderDto,
  UpdateDeliveryOrderDto,
} from './delivery-order.dto';
import dayjs from 'dayjs';

@Injectable()
export class DeliveryOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    DeliveryOrderItems: true,
    Customer: true,
    SalesOrder: true,
  } satisfies Prisma.DeliveryOrderInclude;

  async create(data: CreateDeliveryOrderDto & { userId: number }) {
    const { items, ...deliveryOrderData } = data;
    const number = await this.generateNumber();

    return this.prisma.deliveryOrder.create({
      data: {
        ...deliveryOrderData,
        number,
        DeliveryOrderItems: { create: items },
      },
      include: this.includeRelations,
    });
  }

  async findAll(query: QueryDeliveryOrderDto) {
    const where: Prisma.DeliveryOrderWhereInput = {};
    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { sender: { contains: query.keyword, mode: 'insensitive' } },
        { recipient: { contains: query.keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.salesOrderId) where.salesOrderId = query.salesOrderId;
    if (query.customerId) where.customerId = query.customerId;

    return this.prisma.deliveryOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        SalesOrder: { select: { id: true, number: true, title: true } },
        _count: { select: { DeliveryOrderItems: true } },
      },
    });
  }

  async findOne(id: number) {
    const deliveryOrder = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!deliveryOrder)
      throw new NotFoundException(`Delivery order with ID ${id} not found`);

    return deliveryOrder;
  }

  async update(id: number, data: UpdateDeliveryOrderDto) {
    await this.findOne(id);

    const { items, ...deliveryOrderData } = data;

    if (items) {
      return this.prisma.$transaction(async (transaction) => {
        await transaction.deliveryOrderItem.deleteMany({
          where: { deliveryOrderId: id },
        });

        return transaction.deliveryOrder.update({
          where: { id },
          data: {
            ...deliveryOrderData,
            DeliveryOrderItems: { create: items },
          },
          include: this.includeRelations,
        });
      });
    }

    return this.prisma.deliveryOrder.update({
      where: { id },
      data: deliveryOrderData,
      include: this.includeRelations,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.deliveryOrder.delete({ where: { id } });
  }

  private async generateNumber(): Promise<string> {
    const lastOrder = await this.prisma.deliveryOrder.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });

    const lastNumber = lastOrder
      ? parseInt(lastOrder.number.split('-').pop() || '0', 10)
      : 0;

    return `DO${dayjs().format('MMYYYY')}-${lastNumber + 1}`;
  }
}
