import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  SalesOrderStatus,
  DeliveryOrderStatus,
} from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDeliveryOrderDto,
  QueryDeliveryOrderDto,
  UpdateDeliveryOrderDto,
} from './delivery-order.dto';
import dayjs from 'dayjs';
import { generateDeliveryOrderPdf } from './delivery-order-pdf';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';

@Injectable()
export class DeliveryOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(id: number) {
    return generateDeliveryOrderPdf(await this.findOne(id));
  }

  async exportToPdf(query: QueryDeliveryOrderDto): Promise<Buffer> {
    const deliveryOrders = (await this.findAll(query)) as any[];
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
        .text('DELIVERY ORDERS', { align: 'center' });

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
            { label: 'DO Number', property: 'number', width: 80 },
            {
              label: 'Customer',
              property: 'customer',
              width: doc.page.width - 80 - 70 - 80 - 80 - 90 - 100,
            },
            { label: 'SO Ref', property: 'salesOrder', width: 80 },
            {
              label: 'Status',
              property: 'status',
              width: 100,
              align: 'center',
            },
          ],
          data: deliveryOrders.map((deliveryOrder) => ({
            date: dayjs(deliveryOrder.date).format('DD-MM-YYYY'),
            number: deliveryOrder.number || '-',
            customer: deliveryOrder.Customer?.name || '-',
            salesOrder: deliveryOrder.SalesOrder?.number || '-',
            status: deliveryOrder.status || '-',
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

  async exportToExcel(query: QueryDeliveryOrderDto): Promise<Buffer> {
    const deliveryOrders = (await this.findAll(query)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DeliveryOrders');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'No', key: 'number', width: 18 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Sales Order', key: 'salesOrder', width: 22 },
      { header: 'Status', key: 'status', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    deliveryOrders.forEach((deliveryOrder) => {
      worksheet.addRow({
        date: dayjs(deliveryOrder.date).format('DD-MM-YYYY'),
        number: deliveryOrder.number,
        customer: deliveryOrder.Customer?.name || '-',
        salesOrder: deliveryOrder.SalesOrder?.number || '-',
        status: deliveryOrder.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private readonly includeRelations = {
    DeliveryOrderItems: true,
    Customer: {
      include: {
        Contacts: true,
      },
    },
    SalesOrder: true,
    GoodsReceipt: true,
    User: { select: { id: true, name: true } },
    Company: { select: { id: true, name: true, address: true } },
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
        { receiptNumber: { contains: query.keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.salesOrderId) where.salesOrderId = Number(query.salesOrderId);
    if (query.customerId) where.customerId = Number(query.customerId);

    if (query.dateRange && query.dateRange.length === 2) {
      const [startDate, endDate] = query.dateRange;
      where.date = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (query.status) {
      where.status = Array.isArray(query.status)
        ? { in: query.status }
        : query.status;
    }

    const take = query.pageSize ? parseInt(query.pageSize, 10) : undefined;
    const skip =
      query.page && query.pageSize
        ? (parseInt(query.page, 10) - 1) * parseInt(query.pageSize, 10)
        : undefined;

    const data = await this.prisma.deliveryOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      take,
      skip,
      include: {
        Customer: { select: { id: true, name: true } },
        SalesOrder: {
          select: { id: true, number: true, referenceNumber: true },
        },
        User: { select: { id: true, name: true } },
        _count: { select: { DeliveryOrderItems: true } },
      },
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.deliveryOrder.count({ where });
      return { data, total };
    }

    return data;
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
    const deliveryOrder = await this.findOne(id);

    if (deliveryOrder.status !== DeliveryOrderStatus.Draft) {
      throw new BadRequestException(
        `Cannot delete a delivery order that is not in draft status`,
      );
    }

    return this.prisma.deliveryOrder.delete({ where: { id } });
  }

  async updateSoItemReceivedQuantities(id: number) {
    const deliveryOrder = await this.prisma.deliveryOrder.findUnique({
      where: { id, status: 'Confirmed' },
      include: { DeliveryOrderItems: true },
    });

    if (!deliveryOrder) {
      throw new NotFoundException(`Delivery order with ID ${id} not found`);
    }

    for (const item of deliveryOrder.DeliveryOrderItems) {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.salesOrderItem.updateMany({
          where: {
            salesOrderId: deliveryOrder.salesOrderId,
            partNumber: item.partNumber,
          },
          data: {
            deliveredQuantity: {
              increment: item.quantitySupply,
            },
          },
        });
      });
    }

    let status: SalesOrderStatus = 'PartiallyDelivered';

    // check if all sales order items have been fully delivered
    const outstandingItemsCount = await this.prisma.salesOrderItem.count({
      where: {
        salesOrderId: deliveryOrder.salesOrderId,
        deliveredQuantity: {
          lt: this.prisma.salesOrderItem.fields.quantity,
        },
      },
    });

    if (outstandingItemsCount === 0) {
      status = 'Completed';
    }

    await this.prisma.salesOrder.update({
      where: { id: deliveryOrder.salesOrderId },
      data: { status },
    });
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
