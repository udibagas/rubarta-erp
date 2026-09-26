import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSalesOrderDto,
  UpdateSalesOrderDto,
  QuerySalesOrderDto,
  SendSalesOrderEmailDto,
} from './sales-order.dto';
import { Prisma, SalesOrderStatus } from '../prisma/client/client';
import { parsePurchaseOrderItems } from './parser';
import { generateOrderPdf } from './sales-order-pdf';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async create(data: CreateSalesOrderDto & { userId: number }) {
    const { items, ...salesOrderData } = data;
    const number = await this.generateNumber();

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const vatAmount = totalAmount * 0.11;
    const discount = salesOrderData.discount || 0;
    const grandTotal = totalAmount + vatAmount - discount;

    return this.prisma.salesOrder.create({
      data: {
        ...salesOrderData,
        number,
        totalAmount,
        vatAmount,
        grandTotal,
        SalesOrderItems: {
          create: items.map((item) => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
    });
  }

  async findAll(query: QuerySalesOrderDto) {
    const where: Prisma.SalesOrderWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { referenceNumber: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.customerId) {
      where.customerId = parseInt(query.customerId);
    }

    if (query.status) {
      where.status = Array.isArray(query.status)
        ? { in: query.status }
        : query.status;
    }

    if (query.dateRange && query.dateRange.length === 2) {
      const [startDate, endDate] = query.dateRange;
      where.date = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    const skip =
      query.page && query.pageSize
        ? (parseInt(query.page) - 1) * parseInt(query.pageSize)
        : undefined;

    const take = query.pageSize ? parseInt(query.pageSize) : undefined;

    const data = await this.prisma.salesOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take,
      include: {
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        _count: {
          select: { SalesOrderItems: true },
        },
        SalesOrderItems: {
          select: {
            quantity: true,
            deliveredQuantity: true,
          },
        },
        Invoices: {
          where: { status: 'Paid' },
          select: {
            grandTotal: true,
          },
        },
      },
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.salesOrder.count({ where });
      return { data, total };
    }

    return data;
  }

  async findOne(id: number) {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        Customer: true,
        SalesOrderItems: {
          orderBy: { sortOrder: 'asc' },
        },
        DeliveryOrders: {
          orderBy: { date: 'desc' },
          include: {
            _count: {
              select: { DeliveryOrderItems: true },
            },
          },
        },
        Invoices: {
          orderBy: { date: 'desc' },
          include: {
            _count: {
              select: { InvoiceItems: true },
            },
          },
        },
        User: {
          select: { id: true, name: true, email: true },
        },
        Company: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    if (!salesOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return salesOrder;
  }

  async update(id: number, data: UpdateSalesOrderDto) {
    await this.findOne(id); // Verify exists
    const { items, ...salesOrderData } = data;

    // If items are provided, recalculate totals
    if (items) {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      const vatAmount = totalAmount * 0.11;
      const discount = salesOrderData.discount || 0;
      const grandTotal = totalAmount + vatAmount - discount;

      // Delete existing items and create new ones
      await this.prisma.salesOrderItem.deleteMany({
        where: { salesOrderId: id },
      });

      return this.prisma.salesOrder.update({
        where: { id },
        data: {
          ...salesOrderData,
          totalAmount,
          vatAmount,
          grandTotal,
          SalesOrderItems: {
            create: items.map((i) => ({
              ...i,
              totalPrice: i.unitPrice * i.quantity,
            })),
          },
        },
      });
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: salesOrderData,
    });
  }

  async remove(id: number) {
    const salesOrder = await this.findOne(id); // Verify exists

    // Soft delete
    if (salesOrder.status !== SalesOrderStatus.Draft) {
      throw new BadRequestException(
        `Cannot delete a sales order that is not in draft status`,
      );
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async parsePo(pdfBuffer: Buffer) {
    return parsePurchaseOrderItems(pdfBuffer);
  }

  async preview(id: number): Promise<Buffer> {
    const salesOrder = await this.findOne(id);
    return generateOrderPdf(salesOrder);
  }

  async exportToPdf(query: QuerySalesOrderDto): Promise<Buffer> {
    const salesOrders = (await this.findAll(query)) as any[];
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
        .text('SALES ORDERS', { align: 'center' });

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
            { label: 'SO Number', property: 'number', width: 70 },
            {
              label: 'Customer',
              property: 'customer',
              width: doc.page.width - 80 - 70 - 70 - 70 - 90 - 100,
            },
            {
              label: 'Ref. Number',
              property: 'referenceNumber',
              width: 70,
            },
            { label: 'Total', property: 'total', width: 90, align: 'right' },
            {
              label: 'Status',
              property: 'status',
              width: 100,
              align: 'center',
            },
          ],
          data: salesOrders.map((order) => ({
            date: dayjs(order.date).format('DD-MM-YYYY'),
            number: order.number || '-',
            customer: order.Customer?.name || '-',
            referenceNumber: order.referenceNumber || '-',
            total: (order.grandTotal || 0).toLocaleString('id-ID', {
              style: 'currency',
              currency: order.currency || 'IDR',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            status: order.status || '-',
          })),
        },
        {
          x: 40,
          y: 80,
          width: doc.page.width - 80, // Adjust width to fit within page margins
          hideHeader: false,
        },
      );

      doc.end();
    });
  }

  async exportToExcel(query: QuerySalesOrderDto): Promise<Buffer> {
    const salesOrders = (await this.findAll(query)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SalesOrders');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'No', key: 'number', width: 18 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Reference Number', key: 'referenceNumber', width: 30 },
      { header: 'Grand Total', key: 'grandTotal', width: 18 },
      { header: 'Currency', key: 'currency', width: 12 },
      { header: 'Status', key: 'status', width: 18 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    salesOrders.forEach((order) => {
      worksheet.addRow({
        date: dayjs(order.date).format('DD-MM-YYYY'),
        number: order.number,
        customer: order.Customer?.name || '-',
        referenceNumber: order.referenceNumber || '-',
        grandTotal: order.grandTotal || 0,
        currency: order.currency || 'IDR',
        status: order.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async send(id: number, dto: SendSalesOrderEmailDto) {
    const { to, cc, subject, body } = dto;
    const salesOrder = await this.findOne(id);
    const pdfBuffer = await generateOrderPdf(salesOrder);

    await this.mailerService.sendMail({
      subject,
      cc: [salesOrder.User.email, ...(cc || [])],
      to,
      template: 'sales-order',
      context: {
        salesOrder,
        body,
      },
      attachments: [
        {
          filename: `${salesOrder.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.Sent },
    });
  }

  private async generateNumber(): Promise<string> {
    const lastOrder = await this.prisma.salesOrder.findFirst({
      orderBy: { id: 'desc' },
    });

    const monthYear = dayjs().format('MMYYYY');

    const lastNumber = lastOrder
      ? parseInt(lastOrder.number.split('-').pop())
      : 0;

    const newNumber = lastNumber + 1;
    return `SO${monthYear}-${newNumber}`;
  }
}
