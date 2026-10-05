import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../prisma/client/client';
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
import { PurchaseOrdersPolicy } from './purchase-orders.policy';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
    private readonly approvalService: ApprovalService,
    private readonly policy: PurchaseOrdersPolicy,
  ) {}

  async create(data: CreatePurchaseOrderDto & { userId: number }, user: User) {
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

  async findAll(query: QueryPurchaseOrderDto, user: User) {
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

    if (query.paymentStatus)
      where.paymentStatus = Array.isArray(query.paymentStatus)
        ? { in: query.paymentStatus }
        : query.paymentStatus;

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

  async findOne(id: number, user: User) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: {
        PurchaseOrderItems: { orderBy: { sortOrder: 'asc' } },
        Supplier: true,
        Company: { select: { id: true, name: true, address: true } },
        User: { select: { id: true, name: true, email: true } },
      },
    });
    if (!order)
      throw new NotFoundException(`Purchase order with ID ${id} not found`);
    return order;
  }

  async update(id: number, data: UpdatePurchaseOrderDto, user: User) {
    await this.findOne(id, user);
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

  async remove(id: number, user: User) {
    const order = await this.findOne(id, user);

    if (order.status !== PurchaseOrderStatus.Draft) {
      throw new BadRequestException(
        `Cannot delete a purchase order that is not in draft status`,
      );
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async submit(id: number, user: User) {
    await this.findOne(id, user);
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

  async send(id: number, dto: SendPurchaseOrderEmailDto, user: User) {
    const { to, cc, subject, body } = dto;
    const order = await this.findOne(id, user);
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

  async preview(id: number, user: User) {
    return generatePurchaseOrderPdf(await this.findOne(id, user));
  }

  getOutstandingOrders(groupBy: string = 'supplier', supplierId?: number) {
    const supplierFilter =
      supplierId != null
        ? Prisma.sql`AND po."supplierId" = ${supplierId}`
        : Prisma.empty;

    if (groupBy === 'supplier') {
      return this.prisma.$queryRaw<any[]>`
      SELECT 
        s.name AS "supplierName",
        COUNT(DISTINCT po.id)::int AS "orderCount",
        SUM(poi."quantity")::int AS "orderedQty",
        SUM(poi."receivedQuantity")::int AS "receivedQty",
        SUM(poi."quantity" - poi."receivedQuantity")::int AS "outstandingQty",
        SUM((poi."quantity" - poi."receivedQuantity") * poi."unitPrice")::varchar AS "outstandingAmount"
      FROM "PurchaseOrders" po
      JOIN "Suppliers" s ON po."supplierId" = s.id
      JOIN "PurchaseOrderItems" poi ON po.id = poi."purchaseOrderId" 
      WHERE po."deletedAt" IS NULL
        AND po.status NOT IN ('Draft', 'Completed', 'Cancelled')
        AND poi."receivedQuantity" < poi."quantity"
        ${supplierFilter}
      GROUP BY s.name
    `;
    }

    if (groupBy === 'po') {
      return this.prisma.$queryRaw<any[]>`
      SELECT 
        po.id AS "poId",
        po."number" AS "poNumber",
        s.name AS "supplierName",
        COUNT(poi.id)::int AS "itemCount",
        SUM(poi."quantity")::int AS "orderedQty",
        SUM(poi."receivedQuantity")::int AS "receivedQty",
        SUM(poi."quantity" - poi."receivedQuantity")::int AS "outstandingQty",
        SUM((poi."quantity" - poi."receivedQuantity") * poi."unitPrice")::varchar AS "outstandingAmount"
      FROM "PurchaseOrders" po
      JOIN "Suppliers" s ON po."supplierId" = s.id
      JOIN "PurchaseOrderItems" poi ON po.id = poi."purchaseOrderId" 
      WHERE po."deletedAt" IS NULL
        AND po.status NOT IN ('Draft', 'Completed', 'Cancelled')
        AND poi."receivedQuantity" < poi."quantity"
        ${supplierFilter}
      GROUP BY po.id, po."number", s.name
    `;
    }

    if (groupBy === 'item') {
      return this.prisma.$queryRaw<any[]>`
      SELECT 
        poi.id AS "itemId",
        poi."partNumber" AS "partNumber",
        poi."description" AS "description",
        po.id AS "poId",
        po."number" AS "poNumber",
        s.name AS "supplierName",
        poi."quantity"::int AS "orderedQty",
        poi."receivedQuantity"::int AS "receivedQty",
        (poi."quantity" - poi."receivedQuantity")::int AS "outstandingQty",
        ((poi."quantity" - poi."receivedQuantity") * poi."unitPrice")::varchar AS "outstandingAmount"
      FROM "PurchaseOrderItems" poi
      JOIN "PurchaseOrders" po ON po.id = poi."purchaseOrderId"
      JOIN "Suppliers" s ON po."supplierId" = s.id
      WHERE po."deletedAt" IS NULL
        AND po.status NOT IN ('Draft', 'Completed', 'Cancelled')
        AND poi."receivedQuantity" < poi."quantity"
        ${supplierFilter}
      GROUP BY poi.id, poi."partNumber", poi."description", po.id, po."number", s.name
    `;
    }

    return [];
  }

  async exportOutstandingToPdf(
    groupBy: string = 'supplier',
    supplierId?: number,
  ): Promise<Buffer> {
    const rows = await this.getOutstandingOrders(groupBy, supplierId);
    const columns = this.getOutstandingExportColumns(groupBy);
    const PDFDocumentWithTables = createPdfDocumentWithTables(PDFDocument);
    const doc = new PDFDocumentWithTables({
      size: 'A4',
      margin: 40,
      layout: 'landscape',
    });
    const totalColumnWidth = columns.reduce(
      (sum, column) => sum + column.width,
      0,
    );
    const availableWidth = doc.page.width - 80;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('OUTSTANDING PURCHASE ORDERS', { align: 'center' });
      doc.moveDown(1.5);
      doc.table(
        {
          headers: columns.map((column) => ({
            label: column.header,
            property: column.key,
            align: column.align,
            width: (column.width / totalColumnWidth) * availableWidth,
          })),
          data: rows,
        },
        { x: 40, y: 80, width: availableWidth, hideHeader: false },
      );

      doc.end();
    });
  }

  async exportOutstandingToExcel(
    groupBy: string = 'supplier',
    supplierId?: number,
  ): Promise<Buffer> {
    const rows = await this.getOutstandingOrders(groupBy, supplierId);
    const columns = this.getOutstandingExportColumns(groupBy);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('OutstandingOrders');

    worksheet.columns = columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width,
    }));
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    rows.forEach((row) => {
      worksheet.addRow({
        ...row,
        outstandingAmount: Number(row.outstandingAmount),
      });
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private getOutstandingExportColumns(groupBy: string) {
    if (groupBy === 'po') {
      return [
        { header: 'PO Number', key: 'poNumber', width: 20 },
        { header: 'Supplier', key: 'supplierName', width: 30 },
        { header: 'Item Count', key: 'itemCount', width: 14, align: 'center' },
        {
          header: 'Ordered Qty',
          key: 'orderedQty',
          width: 14,
          align: 'center',
        },
        {
          header: 'Received Qty',
          key: 'receivedQty',
          width: 14,
          align: 'center',
        },
        {
          header: 'Outstanding Qty',
          key: 'outstandingQty',
          width: 18,
          align: 'center',
        },
        // { header: 'Outstanding Amount', key: 'outstandingAmount', width: 22 },
      ];
    }

    if (groupBy === 'item') {
      return [
        { header: 'Item ID', key: 'itemId', width: 12 },
        { header: 'Part Number', key: 'partNumber', width: 20 },
        { header: 'Description', key: 'description', width: 35 },
        { header: 'PO Number', key: 'poNumber', width: 20 },
        { header: 'Supplier', key: 'supplierName', width: 30 },
        {
          header: 'Ordered Qty',
          key: 'orderedQty',
          width: 14,
          align: 'center',
        },
        {
          header: 'Received Qty',
          key: 'receivedQty',
          width: 14,
          align: 'center',
        },
        {
          header: 'Outstanding Qty',
          key: 'outstandingQty',
          width: 18,
          align: 'center',
        },
        // { header: 'Outstanding Amount', key: 'outstandingAmount', width: 22 },
      ];
    }

    return [
      { header: 'Supplier', key: 'supplierName', width: 30 },
      { header: 'Order Count', key: 'orderCount', width: 14, align: 'center' },
      { header: 'Ordered Qty', key: 'orderedQty', width: 14, align: 'center' },
      {
        header: 'Received Qty',
        key: 'receivedQty',
        width: 14,
        align: 'center',
      },
      {
        header: 'Outstanding Qty',
        key: 'outstandingQty',
        width: 18,
        align: 'center',
      },
      // { header: 'Outstanding Amount', key: 'outstandingAmount', width: 22 },
    ];
  }

  async exportToPdf(query: QueryPurchaseOrderDto, user: User): Promise<Buffer> {
    const purchaseOrders = (await this.findAll(query, user)) as any[];
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

  async exportToExcel(
    query: QueryPurchaseOrderDto,
    user: User,
  ): Promise<Buffer> {
    const purchaseOrders = (await this.findAll(query, user)) as any[];
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
