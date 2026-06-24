import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateQuotationDto,
  UpdateQuotationDto,
  QueryQuotationDto,
} from './dto/quotation.dto';
import { Prisma, QuotationStatus } from '../prisma/client/client';

@Injectable()
export class QuotationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateQuotationDto) {
    const { items, ...quotationData } = data;

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
}
