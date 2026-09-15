import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PurchaseOrderStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGoodsReceiptDto,
  QueryGoodsReceiptDto,
  UpdateGoodsReceiptDto,
} from './goods-receipt.dto';
import dayjs from 'dayjs';
import { parsePackingListItems } from './packing-list.parser';
import { generateGoodsReceiptPdf } from './goods-receipt-pdf';

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async parsePackingList(pdfBuffer: Buffer) {
    return parsePackingListItems(pdfBuffer);
  }

  async preview(id: number) {
    return generateGoodsReceiptPdf(await this.findOne(id));
  }

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

  async updatePoItemReceivedQuantities(id: number) {
    const gr = await this.prisma.goodsReceipt.findUnique({
      where: { id, status: 'Confirmed' },
      include: { GoodsReceiptItems: true },
    });

    if (!gr) {
      throw new NotFoundException(`Goods receipt with ID ${id} not found`);
    }

    for (const item of gr.GoodsReceiptItems) {
      this.prisma.$transaction(async (transaction) => {
        await transaction.purchaseOrderItem.updateMany({
          where: {
            purchaseOrderId: gr.purchaseOrderId,
            partNumber: item.partNumber,
          },
          data: {
            receivedQuantity: {
              increment: item.quantityReceived,
            },
          },
        });
      });
    }

    let status: PurchaseOrderStatus = 'PartiallyReceived';

    // check if all purchase order items have been fully received
    const hasOutstandingItems = await this.prisma.purchaseOrderItem.count({
      where: {
        purchaseOrderId: gr.purchaseOrderId,
        receivedQuantity: {
          lt: this.prisma.purchaseOrderItem.fields.quantity,
        },
      },
    });

    if (hasOutstandingItems === 0) {
      status = 'Completed';
    }

    await this.prisma.purchaseOrder.update({
      where: { id: gr.purchaseOrderId },
      data: { status },
    });
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
