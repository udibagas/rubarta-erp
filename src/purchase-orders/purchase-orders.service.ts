import { Injectable, NotFoundException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ApprovalService } from '../approval/approval.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApprovalType,
  Prisma,
  PurchaseOrderStatus,
} from '../prisma/client/client';
import {
  CreatePurchaseOrderDto,
  QueryPurchaseOrderDto,
  SendPurchaseOrderEmailDto,
  UpdatePurchaseOrderDto,
} from './purchase-order.dto';
import { generatePurchaseOrderPdf } from './purchase-order-pdf';
import dayjs from 'dayjs';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly approvalService: ApprovalService,
  ) {}

  async create(data: CreatePurchaseOrderDto & { userId: number }) {
    const { items, ...purchaseOrderData } = data;
    const number = await this.generateNumber();
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const vatAmount = totalAmount * 0.11;
    const discount = purchaseOrderData.discount || 0;

    return this.prisma.purchaseOrder.create({
      data: {
        ...purchaseOrderData,
        number,
        totalAmount,
        vatAmount,
        grandTotal: totalAmount + vatAmount - discount,
        PurchaseOrderItems: {
          create: items.map((item) => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        PurchaseOrderItems: true,
        Supplier: true,
        Company: true,
        User: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll(query: QueryPurchaseOrderDto) {
    const where: Prisma.PurchaseOrderWhereInput = { deletedAt: null };
    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { referenceNumber: { contains: query.keyword, mode: 'insensitive' } },
        {
          Supplier: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }
    if (query.supplierId) where.supplierId = query.supplierId;
    if (query.status) where.status = query.status;

    return this.prisma.purchaseOrder.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Supplier: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        _count: { select: { PurchaseOrderItems: true } },
      },
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        PurchaseOrderItems: { orderBy: { sortOrder: 'asc' } },
        Supplier: true,
        Company: true,
        User: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order)
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    return order;
  }

  async update(id: number, data: UpdatePurchaseOrderDto) {
    await this.findOne(id);
    const { items, ...purchaseOrderData } = data;
    if (items) {
      const totalAmount = items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0,
      );
      const vatAmount = totalAmount * 0.11;
      const discount = purchaseOrderData.discount || 0;
      await this.prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });
      return this.prisma.purchaseOrder.update({
        where: { id },
        data: {
          ...purchaseOrderData,
          totalAmount,
          vatAmount,
          grandTotal: totalAmount + vatAmount - discount,
          PurchaseOrderItems: {
            create: items.map((item) => ({
              ...item,
              totalPrice: item.quantity * item.unitPrice,
            })),
          },
        },
        include: { PurchaseOrderItems: true, Supplier: true },
      });
    }
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: purchaseOrderData,
      include: { PurchaseOrderItems: true, Supplier: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async submit(id: number) {
    await this.findOne(id);
    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.Pending },
    });
    await this.approvalService.requestApproval(
      ApprovalType.PURCHASE_ORDER,
      id,
      order.companyId,
    );
    return order;
  }

  async send(id: number, dto: SendPurchaseOrderEmailDto) {
    const { to, cc, subject, body } = dto;
    const order = await this.findOne(id);
    const pdfBuffer = await generatePurchaseOrderPdf(order);
    await this.mailerService.sendMail({
      subject,
      to,
      cc: [order.User.email, ...(cc || [])],
      html: body,
      attachments: [
        {
          filename: `${order.number}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.Sent },
    });
  }

  async preview(id: number) {
    return generatePurchaseOrderPdf(await this.findOne(id));
  }

  @OnEvent('approval.completed')
  async handleApprovalCompleted(payload: {
    approvalType: ApprovalType;
    moduleId: number;
  }) {
    if (payload.approvalType !== ApprovalType.PURCHASE_ORDER) return;
    await this.prisma.purchaseOrder.update({
      where: { id: payload.moduleId },
      data: { status: PurchaseOrderStatus.Confirmed },
    });
  }

  @OnEvent('approval.rejected')
  async handleApprovalRejected(payload: {
    approvalType: ApprovalType;
    moduleId: number;
  }) {
    if (payload.approvalType !== ApprovalType.PURCHASE_ORDER) return;
    await this.prisma.purchaseOrder.update({
      where: { id: payload.moduleId },
      data: { status: PurchaseOrderStatus.Cancelled },
    });
  }

  private async generateNumber() {
    const lastOrder = await this.prisma.purchaseOrder.findFirst({
      orderBy: { id: 'desc' },
    });
    const lastNumber = lastOrder
      ? parseInt(lastOrder.number.split('-').pop() || '0', 10)
      : 0;
    return `PO${dayjs().format('MMYYYY')}-${lastNumber + 1}`;
  }
}
