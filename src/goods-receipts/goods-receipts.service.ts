import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGoodsReceiptDto,
  QueryGoodsReceiptDto,
  UpdateGoodsReceiptDto,
} from './goods-receipt.dto';
import dayjs from 'dayjs';

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRelations = {
    GoodsReceiptItems: true,
    Supplier: true,
    PurchaseOrder: true,
  } satisfies Prisma.GoodsReceiptInclude;

  async create(data: CreateGoodsReceiptDto & { userId: number }) {
    const { items, ...goodsReceiptData } = data;
    const number = await this.generateNumber();

    return this.prisma.goodsReceipt.create({
      data: {
        ...goodsReceiptData,
        number,
        GoodsReceiptItems: { create: items },
      },
      include: this.includeRelations,
    });
  }

  async findAll(query: QueryGoodsReceiptDto) {
    const where: Prisma.GoodsReceiptWhereInput = {};

    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { sender: { contains: query.keyword, mode: 'insensitive' } },
        { recipient: { contains: query.keyword, mode: 'insensitive' } },
        {
          Supplier: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.purchaseOrderId) where.purchaseOrderId = query.purchaseOrderId;
    if (query.supplierId) where.supplierId = query.supplierId;

    return this.prisma.goodsReceipt.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Supplier: { select: { id: true, name: true } },
        PurchaseOrder: { select: { id: true, number: true, title: true } },
        _count: { select: { GoodsReceiptItems: true } },
      },
    });
  }

  async findOne(id: number) {
    const goodsReceipt = await this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: this.includeRelations,
    });

    if (!goodsReceipt) {
      throw new NotFoundException(`Good receipt with ID ${id} not found`);
    }

    return goodsReceipt;
  }

  async update(id: number, data: UpdateGoodsReceiptDto) {
    await this.findOne(id);
    const { items, ...goodsReceiptData } = data;

    if (items) {
      return this.prisma.$transaction(async (transaction) => {
        await transaction.goodsReceiptItem.deleteMany({
          where: { goodsReceiptId: id },
        });

        return transaction.goodsReceipt.update({
          where: { id },
          data: {
            ...goodsReceiptData,
            GoodsReceiptItems: { create: items },
          },
          include: this.includeRelations,
        });
      });
    }

    return this.prisma.goodsReceipt.update({
      where: { id },
      data: goodsReceiptData,
      include: this.includeRelations,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.goodsReceipt.delete({ where: { id } });
  }

  private async generateNumber(): Promise<string> {
    const lastReceipt = await this.prisma.goodsReceipt.findFirst({
      orderBy: { id: 'desc' },
      select: { number: true },
    });
    const monthYear = dayjs().format('MMYYYY');
    const lastNumber = lastReceipt
      ? parseInt(lastReceipt.number.split('-').pop() || '0', 10)
      : 0;

    return `GR${monthYear}-${lastNumber + 1}`;
  }
}
