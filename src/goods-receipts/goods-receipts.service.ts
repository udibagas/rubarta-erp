import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  PurchaseOrderStatus,
  GoodsReceiptStatus,
} from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGoodsReceiptDto,
  QueryGoodsReceiptDto,
  UpdateGoodsReceiptDto,
} from './goods-receipt.dto';
import dayjs from 'dayjs';
import { parsePackingListItems } from './packing-list.parser';
import { generateGoodsReceiptPdf } from './goods-receipt-pdf';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';

@Injectable()
export class GoodsReceiptsService {
  constructor(private readonly prisma: PrismaService) {}

  async parsePackingList(pdfBuffer: Buffer) {
    return parsePackingListItems(pdfBuffer);
  }

  async preview(id: number) {
    return generateGoodsReceiptPdf(await this.findOne(id));
  }

  async exportToPdf(query: QueryGoodsReceiptDto): Promise<Buffer> {
    const goodsReceipts = (await this.findAll(query)) as any[];
    const PDFDocumentWithTables = createPdfDocumentWithTables(PDFDocument);
    const doc = new PDFDocumentWithTables({
      size: 'A4',
      margin: 40,
      bufferPages: true,
      layout: 'landscape',
    });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('GOOD RECEIPTS', { align: 'center' });

      doc.moveDown(1.5);

      doc.table(
        {
          headers: [
            {
              label: 'Date',
              property: 'date',
              width: 70,
              padding: [0, 0, 0, 5],
            },
            { label: 'GR Number', property: 'number', width: 80 },
            {
              label: 'Supplier',
              property: 'supplier',
              width: doc.page.width - 80 - 70 - 80 - 80 - 90 - 100,
            },
            { label: 'PO Ref', property: 'purchaseOrder', width: 80 },
            {
              label: 'Status',
              property: 'status',
              width: 100,
              align: 'center',
            },
          ],
          data: goodsReceipts.map((receipt) => ({
            date: dayjs(receipt.date).format('DD-MM-YYYY'),
            number: receipt.number || '-',
            supplier: receipt.Supplier?.name || '-',
            purchaseOrder: receipt.PurchaseOrder?.number || '-',
            status: receipt.status || '-',
          })),
        },
        {
          x: 40,
          y: 80,
          width: doc.page.width - 80,
          hideHeader: false,
        },
      );

      doc.end();
    });
  }

  async exportToExcel(query: QueryGoodsReceiptDto): Promise<Buffer> {
    const goodsReceipts = (await this.findAll(query)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('GoodsReceipts');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'No', key: 'number', width: 18 },
      { header: 'Supplier', key: 'supplier', width: 30 },
      { header: 'Purchase Order', key: 'purchaseOrder', width: 22 },
      { header: 'Status', key: 'status', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    goodsReceipts.forEach((receipt) => {
      worksheet.addRow({
        date: dayjs(receipt.date).format('DD-MM-YYYY'),
        number: receipt.number,
        supplier: receipt.Supplier?.name || '-',
        purchaseOrder: receipt.PurchaseOrder?.number || '-',
        status: receipt.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private readonly includeRelations = {
    GoodsReceiptItems: true,
    Supplier: true,
    PurchaseOrder: true,
    Company: { select: { id: true, name: true, address: true } },
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

    if (query.purchaseOrderId)
      where.purchaseOrderId = Number(query.purchaseOrderId);
    if (query.supplierId) where.supplierId = Number(query.supplierId);

    if (query.dateRange && query.dateRange.length === 2) {
      const [startDate, endDate] = query.dateRange;
      where.date = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (query.status)
      where.status = Array.isArray(query.status)
        ? { in: query.status }
        : query.status;

    const take = query.pageSize ? parseInt(query.pageSize, 10) : undefined;
    const skip =
      query.page && query.pageSize
        ? (parseInt(query.page, 10) - 1) * parseInt(query.pageSize, 10)
        : undefined;

    const data = await this.prisma.goodsReceipt.findMany({
      where,
      orderBy: { date: 'desc' },
      take,
      skip,
      include: {
        Supplier: { select: { id: true, name: true } },
        PurchaseOrder: { select: { id: true, number: true, title: true } },
        _count: { select: { GoodsReceiptItems: true } },
      },
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.goodsReceipt.count({ where });
      return { data, total };
    }

    return data;
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
    const gr = await this.findOne(id);

    if (gr.status !== GoodsReceiptStatus.Draft) {
      throw new BadRequestException(
        `Cannot delete a goods receipt that is not in draft status`,
      );
    }

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
      await this.prisma.$transaction(async (transaction) => {
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
