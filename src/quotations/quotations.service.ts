import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QueryQuotationDto,
} from './dto/quotation.dto';
import {
  ApprovalStatus,
  ApprovalType,
  Prisma,
  Quotation,
  QuotationStatus,
} from '../prisma/client/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import dayjs from 'dayjs';

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(data: CreateQuotationDto) {
    const { items, ...quotationData } = data;
    const number = await this.generateNumber();

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

    const discount = quotationData.discount || 0;
    totalAmount -= discount;
    const grandTotal = totalAmount + vatAmount;

    return this.prisma.quotation.create({
      data: {
        ...quotationData,
        number,
        totalAmount,
        vatAmount,
        grandTotal,
        QuotationItems: {
          create: processedItems,
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
        User: { select: { id: true, name: true } },
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

      const discount = quotationData.discount || 0;
      totalAmount -= discount;
      const grandTotal = totalAmount + vatAmount;

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
            create: processedItems,
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

    this.eventEmitter.emit('quotation.submitted', updatedQuotation);

    return updatedQuotation;
  }

  @OnEvent('quotation.submitted', { async: true })
  async requestForApproval(quotation: Quotation) {
    const approval = await this.prisma.approvalSetting.findFirst({
      where: {
        approvalType: ApprovalType.QUOTATION,
      },
      include: { ApprovalSettingItem: true },
    });

    const quotationApproval = await this.prisma.approval.create({
      data: {
        approvalType: ApprovalType.QUOTATION,
        moduleId: quotation.id,
        items: {
          create: approval.ApprovalSettingItem.map((i) => ({
            userId: i.userId,
            order: i.level,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // TODO: harusnya berjenjang
    quotationApproval.items.forEach((i) => {
      this.eventEmitter.emit('quotation.notifyApprover', quotation, i.userId);
    });
  }

  @OnEvent('quotation.notifyApprover')
  async notifyApprover(quotation: Quotation, userId: number) {
    const approvalItem = await this.prisma.approvalItem.findFirst({
      where: {
        userId,
        approval: {
          approvalType: ApprovalType.QUOTATION,
          moduleId: quotation.id,
        },
      },
    });

    if (approvalItem) {
      // TODO: send notification to approvers
    }
  }

  async approve(id: number, userId: number, remarks?: string) {
    const quotation = await this.findOne(id);

    const where = {
      userId,
      approval: {
        approvalType: ApprovalType.QUOTATION,
        moduleId: id,
      },
    };

    const approvalItem = await this.prisma.approvalItem.findFirst({ where });

    if (!approvalItem) {
      throw new ForbiddenException(
        'You are not allowed to perform this action',
      );
    }

    // await this.prisma.approvalItem.update({
    //   where,
    //   data: {
    //     status: ApprovalStatus.APPROVED,
    //     remarks: remarks,
    //   },
    // });
  }

  async send(id: number) {
    await this.findOne(id);

    const updatedQuotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: QuotationStatus.Sent,
      },
    });

    // Todo: send email to customer, cc to creator, sales rep, approvers

    return updatedQuotation;
  }

  async generateNumber(): Promise<string> {
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
}
