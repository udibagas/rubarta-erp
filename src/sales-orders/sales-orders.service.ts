import { Injectable, NotFoundException } from '@nestjs/common';
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
      include: {
        SalesOrderItems: true,
        Customer: { select: { id: true, name: true, email: true } },
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
        { description: { contains: query.keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    return this.prisma.salesOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        _count: {
          select: { SalesOrderItems: true },
        },
      },
    });
  }

  async findOne(id: number) {
    const salesOrder = await this.prisma.salesOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        SalesOrderItems: {
          orderBy: { sortOrder: 'asc' },
        },
        Customer: true,
        Invoice: true,
        User: {
          select: { id: true, name: true, email: true },
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
        include: {
          SalesOrderItems: true,
          Customer: { select: { id: true, name: true } },
        },
      });
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: salesOrderData,
      include: {
        SalesOrderItems: true,
        Customer: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify exists

    // Soft delete
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

  async send(id: number, dto: SendSalesOrderEmailDto) {
    const { to, cc, subject, body } = dto;
    const salesOrder = await this.findOne(id);
    const pdfBuffer = await generateOrderPdf(salesOrder);

    await this.mailerService.sendMail({
      subject,
      cc: [salesOrder.User.email, ...(cc || [])],
      to,
      html: body,
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
