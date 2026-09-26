import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalService } from '../approval/approval.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QueryQuotationDto,
  SendQuotationEmailDto,
} from './quotation.dto';
import { ApprovalType, Prisma, QuotationStatus } from '../prisma/client/client';
import dayjs from 'dayjs';
import { MailerService } from '@nestjs-modules/mailer';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';
import { generateQuotationPdf } from './quotation-pdf';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly approvalService: ApprovalService,
  ) {}

  async create(data: CreateQuotationDto & { userId: number }) {
    const { items, ...quotationData } = data;
    const number = await this.generateNumber();

    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const vatAmount = totalAmount * 0.11;
    const discount = quotationData.discount || 0;
    const grandTotal = totalAmount + vatAmount - discount;

    return this.prisma.quotation.create({
      data: {
        ...quotationData,
        number,
        totalAmount,
        vatAmount,
        grandTotal,
        QuotationItems: {
          create: items.map((i) => ({
            ...i,
            totalPrice: i.quantity * i.unitPrice,
          })),
        },
      },
      include: {
        QuotationItems: true,
        Customer: { select: { id: true, name: true, email: true } },
        User: { select: { id: true, name: true } },
        Opportunity: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: QueryQuotationDto) {
    const where: Prisma.QuotationWhereInput = {
      deletedAt: null,
    };

    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { title: { contains: query.keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.customerId) {
      where.customerId = Number(query.customerId);
    }

    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
    }

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

    const skip =
      query.page && query.pageSize
        ? (parseInt(query.page) - 1) * parseInt(query.pageSize)
        : undefined;

    const quotations = await this.prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: query.pageSize ? parseInt(query.pageSize) : undefined,
      include: {
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Opportunity: { select: { id: true, name: true } },
        _count: {
          select: { QuotationItems: true },
        },
      },
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.quotation.count({ where });
      return { data: quotations, total };
    }

    return quotations;
  }

  async findOne(id: number) {
    const quotation = await this.prisma.quotation.findFirst({
      where: { id, deletedAt: null },
      include: {
        QuotationItems: {
          orderBy: { sortOrder: 'asc' },
        },
        Customer: true,
        User: { select: { id: true, name: true, email: true } },
        Opportunity: true,
        Company: {
          select: { id: true, name: true, address: true },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return quotation;
  }

  async update(id: number, data: UpdateQuotationDto) {
    await this.findOne(id); // Verify exists
    const { items, ...quotationData } = data;

    // If items are provided, recalculate totals
    if (items) {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );

      const vatAmount = totalAmount * 0.11;
      const discount = quotationData.discount || 0;
      const grandTotal = totalAmount + vatAmount - discount;

      // Delete existing items and create new ones
      await this.prisma.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      return this.prisma.quotation.update({
        where: { id },
        data: {
          ...quotationData,
          totalAmount,
          vatAmount,
          grandTotal,
          QuotationItems: {
            create: items.map((item) => ({
              ...item,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          QuotationItems: true,
          Customer: { select: { id: true, name: true } },
          User: { select: { id: true, name: true } },
          Opportunity: { select: { id: true, name: true } },
        },
      });
    }

    return this.prisma.quotation.update({
      where: { id },
      data: quotationData,
      include: {
        QuotationItems: true,
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Opportunity: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    const quotation = await this.findOne(id); // Verify exists

    if (quotation.status !== QuotationStatus.Draft) {
      throw new BadRequestException(
        `Cannot delete a quotation that is not in draft status`,
      );
    }

    // Soft delete
    return this.prisma.quotation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async submit(id: number) {
    await this.findOne(id);

    const updatedQuotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.Submitted,
      },
    });

    await this.approvalService.requestApproval(
      ApprovalType.QUOTATION,
      id,
      updatedQuotation.companyId,
    );

    return updatedQuotation;
  }

  async send(id: number, dto: SendQuotationEmailDto) {
    const { to, cc, subject, body } = dto;
    const quotation = await this.findOne(id);
    const pdfBuffer = await generateQuotationPdf(quotation);

    await this.mailerService.sendMail({
      subject,
      cc: [quotation.User.email, ...(cc || [])],
      to,
      template: 'quotation',
      context: {
        quotation,
        body,
      },
      attachments: [
        {
          filename: `${quotation.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return this.prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.Sent,
        sentDate: new Date(),
      },
    });
  }

  async preview(id: number): Promise<Buffer> {
    const quotation = await this.findOne(id);
    return generateQuotationPdf(quotation);
  }

  async exportToPdf(query: QueryQuotationDto): Promise<Buffer> {
    const quotations = (await this.findAll(query)) as any[];
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
        .text('QUOTATIONS', { align: 'center' });

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
            { label: 'Q Number', property: 'number', width: 80 },
            {
              label: 'Customer',
              property: 'customer',
              width: doc.page.width - 80 - 70 - 80 - 80 - 90 - 100,
            },
            { label: 'Valid Until', property: 'validUntil', width: 80 },
            { label: 'Total', property: 'total', width: 90, align: 'right' },
            {
              label: 'Status',
              property: 'status',
              width: 100,
              align: 'center',
            },
          ],
          data: quotations.map((quotation) => ({
            date: dayjs(quotation.date).format('DD-MM-YYYY'),
            number: quotation.number || '-',
            customer: quotation.Customer?.name || '-',
            validUntil: dayjs(quotation.validUntil).format('DD-MM-YYYY'),
            total: (quotation.grandTotal || 0).toLocaleString('id-ID', {
              style: 'currency',
              currency: quotation.currency || 'IDR',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            status: quotation.status || '-',
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

  async exportToExcel(query: QueryQuotationDto): Promise<Buffer> {
    const quotations = (await this.findAll(query)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Quotations');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'No', key: 'number', width: 18 },
      { header: 'Customer', key: 'customer', width: 30 },
      { header: 'Valid Until', key: 'validUntil', width: 15 },
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

    quotations.forEach((quotation) => {
      worksheet.addRow({
        date: dayjs(quotation.date).format('DD-MM-YYYY'),
        number: quotation.number,
        customer: quotation.Customer?.name || '-',
        validUntil: dayjs(quotation.validUntil).format('DD-MM-YYYY'),
        grandTotal: quotation.grandTotal || 0,
        currency: quotation.currency || 'IDR',
        status: quotation.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateNumber(): Promise<string> {
    const lastQuotation = await this.prisma.quotation.findFirst({
      orderBy: { id: 'desc' },
    });

    const monthYear = dayjs().format('MMYYYY');

    const lastNumber = lastQuotation
      ? parseInt(lastQuotation.number.split('-').pop())
      : 0;

    const newNumber = lastNumber + 1;
    return `QUO${monthYear}-${newNumber}`;
  }

  @OnEvent('approval.completed')
  private async handleApprovalCompleted(payload: {
    approvalType: ApprovalType;
    moduleId: number;
  }) {
    const { approvalType, moduleId } = payload;

    if (approvalType !== ApprovalType.QUOTATION) {
      return;
    }

    await this.prisma.quotation.update({
      where: { id: moduleId },
      data: { status: QuotationStatus.Approved },
    });
  }

  @OnEvent('approval.nextApprover')
  private async handleNextApprover(payload: {
    approvalType: ApprovalType;
    moduleId: number;
    userId: number;
  }) {
    const { approvalType, moduleId } = payload;

    if (approvalType !== ApprovalType.QUOTATION) {
      return;
    }

    await this.prisma.quotation.update({
      where: { id: moduleId },
      data: { status: QuotationStatus.PartiallyApproved },
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markAsExpired() {
    await this.prisma.quotation.updateMany({
      where: {
        validUntil: { lt: new Date() },
        status: {
          notIn: [
            QuotationStatus.Expired,
            QuotationStatus.Approved,
            QuotationStatus.Rejected,
          ],
        },
      },
      data: {
        status: QuotationStatus.Expired,
      },
    });

    // TODO: apakah perlu kirim notifikasi ke user & customer bahwa quotation telah expired?
  }
}
