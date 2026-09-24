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
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';

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
    });
  }

  async findAll(query: QueryPurchaseOrderDto) {
    const where: Prisma.PurchaseOrderWhereInput = { deletedAt: null };

    if (query.keyword) {
      where.OR = [
        { number: { contains: query.keyword, mode: 'insensitive' } },
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
        { referenceNumber: { contains: query.keyword, mode: 'insensitive' } },
        {
          Supplier: { name: { contains: query.keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (query.supplierId) where.supplierId = Number(query.supplierId);

    if (query.status)
      where.status = Array.isArray(query.status)
        ? { in: query.status }
        : query.status;

    if (query.dateRange && query.dateRange.length === 2) {
      const [startDate, endDate] = query.dateRange;
      where.date = {
        gte: dayjs(startDate).startOf('day').toDate(),
        lte: dayjs(endDate).endOf('day').toDate(),
      };
    }

    const skip = (Number(query.page) - 1) * Number(query.pageSize) || undefined;
    const take = Number(query.pageSize) || undefined;

    const data = await this.prisma.purchaseOrder.findMany({
      where,
      skip,
      take,
      orderBy: { date: 'desc' },
      include: {
        Supplier: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        PurchaseOrderItems: {
          select: {
            quantity: true,
            receivedQuantity: true,
          },
        },
        _count: { select: { PurchaseOrderItems: true } },
      },
    });

    if (query.page && query.pageSize) {
      const total = await this.prisma.purchaseOrder.count({ where });
      return { data, total };
    }

    return data;
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
      template: 'purchase-order',
      context: {
        order,
        body,
      },
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

  async exportToPdf(query: QueryPurchaseOrderDto): Promise<Buffer> {
    const purchaseOrders = (await this.findAll(query)) as any[];
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
        .text('PURCHASE ORDERS', { align: 'center' });

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
            { label: 'PO Number', property: 'number', width: 80 },
            {
              label: 'Supplier',
              property: 'supplier',
              width: doc.page.width - 80 - 70 - 80 - 80 - 90 - 100,
            },
            { label: 'Reference', property: 'referenceNumber', width: 80 },
            { label: 'Total', property: 'total', width: 90, align: 'right' },
            {
              label: 'Status',
              property: 'status',
              width: 100,
              align: 'center',
            },
          ],
          data: purchaseOrders.map((order) => ({
            date: dayjs(order.date).format('DD-MM-YYYY'),
            number: order.number || '-',
            supplier: order.Supplier?.name || '-',
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
          width: doc.page.width - 80,
          hideHeader: false,
        },
      );

      doc.end();
    });
  }

  async exportToExcel(query: QueryPurchaseOrderDto): Promise<Buffer> {
    const purchaseOrders = (await this.findAll(query)) as any[];
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('PurchaseOrders');

    worksheet.columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'No', key: 'number', width: 18 },
      { header: 'Supplier', key: 'supplier', width: 30 },
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

    purchaseOrders.forEach((order) => {
      worksheet.addRow({
        date: dayjs(order.date).format('DD-MM-YYYY'),
        number: order.number,
        supplier: order.Supplier?.name || '-',
        referenceNumber: order.referenceNumber || '-',
        grandTotal: order.grandTotal || 0,
        currency: order.currency || 'IDR',
        status: order.status,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
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
