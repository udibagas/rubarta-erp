import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateInvoiceDto,
  UpdateInvoiceDto,
  QueryInvoiceDto,
  SendInvoiceEmailDto,
} from './invoice.dto';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceStatus, Prisma } from '../prisma/client/client';
import { generateInvoicePdf } from './invoice-pdf';
import dayjs from 'dayjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MailerService } from '@nestjs-modules/mailer';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';
import * as fs from 'node:fs';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  async create(data: CreateInvoiceDto & { userId: number }) {
    const { items, ...invoiceData } = data;
    const { attachments, ...invoiceFields } = invoiceData;
    const number = await this.generateNumber();
    const totals = this.calculateTotals(items, invoiceData.discount);
    const createData: Prisma.InvoiceUncheckedCreateInput = {
      ...invoiceFields,
      ...(attachments === undefined
        ? {}
        : { attachments: attachments as Prisma.InputJsonValue }),
      number,
      date: new Date(invoiceData.date),
      dueDate: new Date(invoiceData.dueDate),
      ...totals,
      status: InvoiceStatus.Draft,
      InvoiceItems: {
        create: items.map((i) => ({
          ...i,
          totalPrice: i.quantity * i.unitPrice,
        })),
      },
    };

    return this.prisma.invoice.create({ data: createData });
  }

  async findAll(query: QueryInvoiceDto) {
    const {
      page,
      pageSize,
      keyword,
      customerId,
      status,
      dateRange,
      salesOrderId,
    } = query;

    const where: Prisma.InvoiceWhereInput = {};

    if (customerId) {
      where.customerId = Number(customerId);
    }

    if (salesOrderId) {
      where.salesOrderId = Number(salesOrderId);
    }

    if (status) {
      where.status = Array.isArray(status) ? { in: status } : status;
    }

    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      where.date = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    if (keyword) {
      where.OR = [
        {
          number: {
            contains: keyword,
            mode: 'insensitive',
          },
          referenceNumber: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          Customer: {
            name: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
        {
          SalesOrder: {
            number: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
        {
          DeliveryOrder: {
            number: {
              contains: keyword,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const take = query.pageSize ? parseInt(query.pageSize) : undefined;
    const skip =
      query.page && query.pageSize
        ? (parseInt(query.page) - 1) * parseInt(query.pageSize)
        : undefined;

    const data = await this.prisma.invoice.findMany({
      where,
      take,
      skip,
      orderBy: { date: 'desc' },
      include: {
        Customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
        SalesOrder: {
          select: {
            id: true,
            number: true,
          },
        },
        DeliveryOrder: { select: { id: true, number: true } },
        InvoiceItems: true,
        Payments: {
          select: {
            id: true,
            date: true,
            amountPaid: true,
          },
        },
        _count: {
          select: { InvoiceItems: true },
        },
      },
    });

    if (page && pageSize) {
      const total = await this.prisma.invoice.count({ where });
      return { data, total };
    }

    return data;
  }

  async findOne(id: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        Customer: true,
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        SalesOrder: {
          include: {
            SalesOrderItems: true,
          },
        },
        DeliveryOrder: true,
        InvoiceItems: true,
        Payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return invoice;
  }

  async update(id: number, data: UpdateInvoiceDto) {
    const invoice = await this.findOne(id);

    const { items, ...invoiceData } = data;

    const { attachments, ...invoiceFields } = invoiceData;
    const updateData: Prisma.InvoiceUpdateInput = {
      ...invoiceFields,
      ...(attachments === undefined
        ? {}
        : { attachments: attachments as Prisma.InputJsonValue }),
    };

    if (invoiceData.date) {
      updateData.date = new Date(invoiceData.date);
    }

    if (invoiceData.dueDate) {
      updateData.dueDate = new Date(invoiceData.dueDate);
    }

    if (items) {
      const totals = this.calculateTotals(
        items,
        invoiceData.discount ?? invoice.discount,
      );
      Object.assign(updateData, totals);

      await this.prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      updateData.InvoiceItems = {
        create: items.map((item) => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
        })),
      };
    } else if (invoiceData.discount !== undefined) {
      Object.assign(
        updateData,
        this.calculateTotals(invoice.InvoiceItems, invoiceData.discount),
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify invoice exists

    // Delete invoice items first (cascade should handle this, but being explicit)
    await this.prisma.invoiceItem.deleteMany({
      where: { invoiceId: id },
    });

    return this.prisma.invoice.delete({
      where: { id },
    });
  }

  async updateStatus(id: number, status: InvoiceStatus) {
    await this.findOne(id); // Verify invoice exists

    return this.prisma.invoice.update({
      where: { id },
      data: { status },
    });
  }

  async preview(id: number): Promise<Buffer> {
    const invoice = await this.findOne(id);
    return generateInvoicePdf(invoice);
  }

  async exportToPdf(query: QueryInvoiceDto): Promise<Buffer> {
    const invoices = (await this.findAll(query)) as any[];
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
        .text('INVOICES', { align: 'center' });

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
            { label: 'Invoice No', property: 'number', width: 80 },
            {
              label: 'Customer',
              property: 'customer',
              width: doc.page.width - 80 - 70 - 80 - 80 - 90 - 100,
            },
            { label: 'Due Date', property: 'dueDate', width: 80 },
            { label: 'Total', property: 'total', width: 90, align: 'right' },
            {
              label: 'Status',
              property: 'status',
              width: 100,
              align: 'center',
            },
          ],
          data: invoices.map((invoice) => ({
            date: dayjs(invoice.date).format('DD-MM-YYYY'),
            number: invoice.number || '-',
            customer: invoice.Customer?.name || '-',
            dueDate: dayjs(invoice.dueDate).format('DD-MM-YYYY'),
            total: (invoice.grandTotal || 0).toLocaleString('id-ID', {
              style: 'currency',
              currency: invoice.currency || 'IDR',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            status: invoice.status || '-',
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

  async exportToExcel(query: QueryInvoiceDto): Promise<Buffer> {
    const invoices = (await this.findAll(query)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Invoices');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'No', key: 'number', width: 18 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
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

    invoices.forEach((invoice) => {
      worksheet.addRow({
        date: dayjs(invoice.date).format('DD-MM-YYYY'),
        number: invoice.number,
        customer: invoice.Customer?.name || '-',
        dueDate: dayjs(invoice.dueDate).format('DD-MM-YYYY'),
        grandTotal: invoice.grandTotal || 0,
        currency: invoice.currency || 'IDR',
        status: invoice.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async send(id: number, dto: SendInvoiceEmailDto) {
    const { to, cc, subject, body } = dto;
    const invoice = await this.findOne(id);
    const pdfBuffer = await generateInvoicePdf(invoice);

    const invoiceAttachments = Array.isArray(invoice.attachments)
      ? invoice.attachments
          .map((attachment: any) => {
            if (!attachment || typeof attachment !== 'object') return null;

            const filePath =
              typeof attachment.filePath === 'string'
                ? attachment.filePath
                : null;
            const fileName =
              typeof attachment.fileName === 'string'
                ? attachment.fileName
                : filePath?.split('/').pop() || 'attachment';
            const fileType =
              typeof attachment.fileType === 'string'
                ? attachment.fileType
                : 'application/octet-stream';

            if (!filePath) return null;

            try {
              return {
                filename: fileName,
                content: fs.readFileSync(filePath),
                contentType: fileType,
              };
            } catch (error) {
              console.warn(
                `Skipping invoice attachment for ${invoice.id}: ${filePath}`,
                error,
              );
              return null;
            }
          })
          .filter(
            (attachment): attachment is NonNullable<typeof attachment> =>
              !!attachment,
          )
      : [];

    await this.mailerService.sendMail({
      subject,
      cc: [invoice.User.email, ...(cc || [])],
      to,
      template: 'invoice',
      context: {
        invoice,
        body,
      },
      attachments: [
        {
          filename: `${invoice.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        ...invoiceAttachments,
      ],
    });

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.Sent },
    });
  }

  async getTotalAmount(customerId?: number, status?: InvoiceStatus) {
    const where: Prisma.InvoiceWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (status) {
      where.status = status;
    }

    const result = await this.prisma.invoice.aggregate({
      where,
      _sum: {
        grandTotal: true,
      },
      _count: true,
    });

    return {
      totalAmount: result._sum.grandTotal || 0,
      count: result._count,
    };
  }

  private async generateNumber(): Promise<string> {
    const lastQuotation = await this.prisma.invoice.findFirst({
      orderBy: { id: 'desc' },
    });

    const monthYear = dayjs().format('MMYYYY');

    const lastNumber = lastQuotation
      ? parseInt(lastQuotation.number.split('-').pop())
      : 0;

    const newNumber = lastNumber + 1;
    return `INV${monthYear}-${newNumber}`;
  }

  private calculateTotals(
    items: Array<{ quantity: number; unitPrice: number }>,
    discount = 0,
  ) {
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const vatAmount = totalAmount * 0.11;

    return {
      totalAmount,
      discount,
      vatAmount,
      grandTotal: totalAmount + vatAmount - discount,
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markAsExpired() {
    await this.prisma.invoice.updateMany({
      where: {
        dueDate: { lt: new Date() },
        status: {
          notIn: [
            InvoiceStatus.Draft,
            InvoiceStatus.Overdue,
            InvoiceStatus.Paid,
          ],
        },
      },
      data: {
        status: InvoiceStatus.Overdue,
      },
    });

    // TODO: apakah perlu kirim notifikasi ke user & customer bahwa invoice sudah overdue?
  }
}
