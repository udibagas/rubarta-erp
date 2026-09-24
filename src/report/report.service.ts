import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: number) {
    const nkpDraft = await this.prisma.nkp.count({
      where: { status: 'DRAFT' },
    });

    const nkpClosed = await this.prisma.nkp.count({
      where: { status: 'CLOSED' },
    });

    const nkpOpen = await this.prisma.nkp.count({
      where: { status: { notIn: ['CLOSED', 'DRAFT'] } },
    });

    const pendingApprovalCount = await this.prisma.nkpApproval.count({
      where: { userId, approvalStatus: null },
    });

    return {
      nkpDraft,
      nkpClosed,
      nkpOpen,
      pendingApprovalCount,
    };
  }

  async customerMonthlyRevenue(params: {
    customerId?: number;
    startDate?: string;
    endDate?: string;
    dateRange?: string | string[];
  }) {
    const normalizedDateRange = Array.isArray(params.dateRange)
      ? params.dateRange
      : params.dateRange
        ? [params.dateRange]
        : [];

    const startDate = params.startDate || normalizedDateRange[0];
    const endDate = params.endDate || normalizedDateRange[1];

    const where: any = {};

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (startDate || endDate) {
      where.date = {};

      if (startDate) {
        where.date.gte = dayjs(startDate).startOf('day').toDate();
      }

      if (endDate) {
        where.date.lte = dayjs(endDate).endOf('day').toDate();
      }
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: {
        customerId: true,
        date: true,
        grandTotal: true,
      },
      orderBy: { date: 'asc' },
    });

    const customerIds = [
      ...new Set(invoices.map((invoice) => invoice.customerId)),
    ];
    const customers = customerIds.length
      ? await this.prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : [];

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer.name]),
    );

    const grouped = new Map<
      string,
      {
        customerId: number;
        customerName?: string;
        month: string;
        total: number;
      }
    >();

    for (const invoice of invoices) {
      const month = dayjs(invoice.date).format('YYYY-MM');
      const key = `${invoice.customerId}:${month}`;
      const current = grouped.get(key) ?? {
        customerId: invoice.customerId,
        customerName: customerMap.get(invoice.customerId),
        month,
        total: 0,
      };

      current.total += Number(invoice.grandTotal || 0);
      grouped.set(key, current);
    }

    const data = [...grouped.values()].sort((a, b) => {
      if (a.customerId !== b.customerId) return a.customerId - b.customerId;
      return a.month.localeCompare(b.month);
    });

    return {
      data,
      total: data.reduce((sum, row) => sum + row.total, 0),
    };
  }

  async agingReport(params: { customerId?: number; asOfDate?: string }) {
    const asOfDate = params.asOfDate
      ? dayjs(params.asOfDate).endOf('day')
      : dayjs();
    const where: any = {
      status: { notIn: ['Draft', 'Paid'] },
    };

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    const invoices = await this.prisma.invoice.findMany({
      where,
      select: {
        id: true,
        number: true,
        customerId: true,
        dueDate: true,
        grandTotal: true,
        Customer: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const buckets = [
      { key: 'current', label: 'Current', minDays: null, maxDays: 0 },
      { key: '1-30', label: '1-30 days', minDays: 1, maxDays: 30 },
      { key: '31-60', label: '31-60 days', minDays: 31, maxDays: 60 },
      { key: '61-90', label: '61-90 days', minDays: 61, maxDays: 90 },
      { key: '90+', label: '90+ days', minDays: 91, maxDays: null },
    ];

    const result = buckets.map((bucket) => ({
      bucket: bucket.key,
      label: bucket.label,
      invoiceCount: 0,
      total: 0,
      invoices: [] as Array<{
        id: number;
        number: string;
        customerId: number;
        customerName: string;
        dueDate: Date;
        outstanding: number;
        daysOverdue: number;
      }>,
    }));

    for (const invoice of invoices) {
      const outstanding = Number(invoice.grandTotal || 0);

      if (outstanding === 0) {
        continue;
      }

      const daysOverdue = Math.max(
        asOfDate
          .startOf('day')
          .diff(dayjs(invoice.dueDate).startOf('day'), 'day'),
        0,
      );
      const bucketIndex =
        daysOverdue === 0
          ? 0
          : daysOverdue <= 30
            ? 1
            : daysOverdue <= 60
              ? 2
              : daysOverdue <= 90
                ? 3
                : 4;
      const bucket = result[bucketIndex];

      bucket.invoiceCount += 1;
      bucket.total += outstanding;
      bucket.invoices.push({
        id: invoice.id,
        number: invoice.number,
        customerId: invoice.customerId,
        customerName: invoice.Customer.name,
        dueDate: invoice.dueDate,
        outstanding,
        daysOverdue,
      });
    }

    return {
      asOfDate: asOfDate.toISOString(),
      customerId: params.customerId ?? null,
      buckets: result,
      totalOutstanding: result.reduce((sum, bucket) => sum + bucket.total, 0),
      totalInvoices: result.reduce(
        (sum, bucket) => sum + bucket.invoiceCount,
        0,
      ),
    };
  }

  async exportAgingReportToPdf(params: {
    customerId?: number;
    asOfDate?: string;
  }): Promise<Buffer> {
    const report = await this.agingReport(params);
    const rows = report.buckets.flatMap((bucket) => bucket.invoices);

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
        .text('AGING REPORT', { align: 'center' });

      doc
        .font('Helvetica')
        .fontSize(10)
        .text(`As of ${dayjs(report.asOfDate).format('DD-MM-YYYY')}`, {
          align: 'center',
        });

      doc.moveDown(1.5);

      doc.table(
        {
          headers: [
            { label: 'Invoice No', property: 'number', width: 90 },
            {
              label: 'Customer',
              property: 'customerName',
              width: doc.page.width - 80 - 90 - 80 - 90 - 90 - 90,
            },
            { label: 'Due Date', property: 'dueDate', width: 80 },
            {
              label: 'Days Overdue',
              property: 'daysOverdue',
              width: 90,
              align: 'right',
            },
            {
              label: 'Outstanding',
              property: 'outstanding',
              width: 90,
              align: 'right',
            },
            { label: 'Bucket', property: 'bucket', width: 90 },
          ],
          data: rows.map((row) => ({
            number: row.number || '-',
            customerName: row.customerName || '-',
            dueDate: dayjs(row.dueDate).format('DD-MM-YYYY'),
            daysOverdue: row.daysOverdue,
            outstanding: row.outstanding.toLocaleString('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }),
            bucket: report.buckets.find((bucket) =>
              bucket.invoices.includes(row),
            )?.label,
          })),
        },
        {
          x: 40,
          y: 100,
          width: doc.page.width - 80,
          hideHeader: false,
        },
      );

      doc.moveDown(1);
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(
          `Total Outstanding: ${report.totalOutstanding.toLocaleString(
            'id-ID',
            {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}`,
          { align: 'right' },
        );

      doc.end();
    });
  }

  async exportAgingReportToExcel(params: {
    customerId?: number;
    asOfDate?: string;
  }): Promise<Buffer> {
    const report = await this.agingReport(params);
    const rows = report.buckets.flatMap((bucket) =>
      bucket.invoices.map((invoice) => ({ ...invoice, bucket: bucket.label })),
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Aging Report');

    worksheet.columns = [
      { header: 'Invoice No', key: 'number', width: 18 },
      { header: 'Customer', key: 'customerName', width: 30 },
      { header: 'Due Date', key: 'dueDate', width: 15 },
      { header: 'Days Overdue', key: 'daysOverdue', width: 15 },
      { header: 'Outstanding', key: 'outstanding', width: 18 },
      { header: 'Bucket', key: 'bucket', width: 15 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    rows.forEach((row) => {
      worksheet.addRow({
        number: row.number,
        customerName: row.customerName,
        dueDate: dayjs(row.dueDate).format('DD-MM-YYYY'),
        daysOverdue: row.daysOverdue,
        outstanding: row.outstanding,
        bucket: row.bucket,
      });
    });

    const totalRow = worksheet.addRow({
      customerName: 'Total',
      outstanding: report.totalOutstanding,
    });
    totalRow.font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
