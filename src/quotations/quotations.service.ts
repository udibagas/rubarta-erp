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
import { generateQuotationPdf } from './quotation-pdf';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly approvalService: ApprovalService,
  ) {}

  async create(data: CreateQuotationDto) {
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
      where.customerId = query.customerId;
    }

    if (query.opportunityId) {
      where.opportunityId = query.opportunityId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Opportunity: { select: { id: true, name: true } },
        _count: {
          select: { QuotationItems: true },
        },
      },
    });
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

    // Update status date fields
    if (data.status === QuotationStatus.Sent && !quotationData['sentDate']) {
      quotationData['sentDate'] = new Date();
    }
    if (data.status === QuotationStatus.Accepted) {
      quotationData['acceptedDate'] = new Date();
    }

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
    await this.findOne(id); // Verify exists

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

    await this.approvalService.requestApproval(ApprovalType.QUOTATION, id);
    return updatedQuotation;
  }

  async send(id: number, dto: SendQuotationEmailDto) {
    const quotation = await this.findOne(id);

    if (!quotation.contactEmail) {
      throw new BadRequestException(
        'Quotation does not have a contact email to send to',
      );
    }

    const pdfBuffer = await generateQuotationPdf(quotation);
    const cc = [quotation.User.email, ...(dto.cc || [])];

    await this.mailerService.sendMail({
      to: dto.to || quotation.contactEmail,
      cc,
      subject: dto.subject,
      html: dto.body,
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

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async markAsExpired() {
    await this.prisma.quotation.updateMany({
      where: {
        expirationDate: { lt: new Date() },
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
