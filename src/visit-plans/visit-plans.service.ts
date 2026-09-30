import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateVisitPlanDto,
  QueryVisitPlanDto,
  UpdateVisitPlanDto,
} from './visit-plan.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, VisitPlanStatus, VisitType } from '../prisma/client/client';
import dayjs from 'dayjs';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';

@Injectable()
export class VisitPlansService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateVisitPlanDto) {
    return this.prisma.visitPlan.create({
      data,
      include: {
        Company: { select: { id: true, name: true } },
        Customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });
  }

  private buildWhere(params: QueryVisitPlanDto): Prisma.VisitPlanWhereInput {
    const where: Prisma.VisitPlanWhereInput = {
      deletedAt: null,
    };
    const {
      companyId,
      userId,
      customerId,
      status,
      visitType,
      startDate,
      endDate,
      year,
      month,
      keyword,
    } = params;

    if (companyId) {
      if (Array.isArray(companyId)) {
        where.companyId = { in: companyId.map((id) => +id) };
      } else {
        where.companyId = +companyId;
      }
    }

    if (userId) {
      if (Array.isArray(userId)) {
        where.userId = { in: userId.map((id) => +id) };
      } else {
        where.userId = +userId;
      }
    }

    if (customerId) {
      if (Array.isArray(customerId)) {
        where.customerId = { in: customerId.map((id) => +id) };
      } else {
        where.customerId = +customerId;
      }
    }

    if (status) {
      if (!Array.isArray(status)) {
        where.status = { in: [status] };
      } else {
        where.status = { in: status };
      }
    }

    if (visitType) {
      if (!Array.isArray(visitType)) {
        where.visitType = { in: [visitType] };
      } else {
        where.visitType = { in: visitType };
      }
    }

    // Handle year/month filtering
    if (year || month) {
      const filterYear = year || new Date().getFullYear();
      const filterMonth = month !== undefined ? month : 1;

      const start = new Date(
        filterYear,
        month !== undefined ? filterMonth - 1 : 0,
        1,
      );
      const end =
        month !== undefined
          ? new Date(filterYear, filterMonth, 0, 23, 59, 59, 999)
          : new Date(filterYear, 11, 31, 23, 59, 59, 999);

      where.scheduledDate = {
        gte: start,
        lte: end,
      };
    } else if (startDate || endDate) {
      where.scheduledDate = {};
      if (startDate) {
        where.scheduledDate.gte = startDate;
      }
      if (endDate) {
        where.scheduledDate.lte = endDate;
      }
    }

    if (keyword) {
      where.OR = [
        {
          title: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        {
          purpose: {
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
          contactPerson: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
      ];
    }

    return where;
  }

  async findAll(params: QueryVisitPlanDto) {
    const { page = 1, pageSize = 10 } = params;
    const where = this.buildWhere(params);

    const data = await this.prisma.visitPlan.findMany({
      where,
      take: pageSize,
      skip: (page - 1) * pageSize,
      orderBy: params.sortBy
        ? { [params.sortBy]: params.sortOrder || 'asc' }
        : { scheduledDate: 'desc' },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: {
          select: { id: true, name: true, email: true, phone: true },
        },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });

    const total = await this.prisma.visitPlan.count({ where });
    return { data, page, total };
  }

  private async findAllForExport(params: QueryVisitPlanDto) {
    const where = this.buildWhere(params);

    return this.prisma.visitPlan.findMany({
      where,
      orderBy: params.sortBy
        ? { [params.sortBy]: params.sortOrder || 'asc' }
        : { scheduledDate: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
      },
    });
  }

  private getVisitLocation(visitPlan: {
    visitType: VisitType;
    address?: string | null;
    meetingUrl?: string | null;
  }) {
    if (visitPlan.visitType === VisitType.Online) {
      return visitPlan.meetingUrl || '-';
    }
    return visitPlan.address || '-';
  }

  async exportToPdf(params: QueryVisitPlanDto): Promise<Buffer> {
    const visitPlans = await this.findAllForExport(params);
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
        .text('VISIT PLANS', { align: 'center' });

      doc.moveDown(1.5);

      doc.table(
        {
          headers: [
            { label: 'Scheduled Date', property: 'scheduledDate', width: 90 },
            {
              label: 'Title',
              property: 'title',
              width: (doc.page.width - 80 - 90 - 90 - 100 - 70 - 70) / 2,
            },
            { label: 'Assigned To', property: 'assignedTo', width: 90 },
            { label: 'Customer', property: 'customer', width: 100 },
            { label: 'Status', property: 'status', width: 70 },
            { label: 'Visit Type', property: 'visitType', width: 70 },
            {
              label: 'Location',
              property: 'location',
              width: (doc.page.width - 80 - 90 - 90 - 100 - 70 - 70) / 2,
            },
          ],
          data: visitPlans.map((visitPlan) => ({
            scheduledDate: dayjs(visitPlan.scheduledDate).format('DD-MM-YYYY'),
            title: visitPlan.title,
            assignedTo: visitPlan.User?.name || '-',
            customer: visitPlan.Customer?.name || '-',
            status: visitPlan.status,
            visitType: visitPlan.visitType,
            location: this.getVisitLocation(visitPlan),
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

  async exportToExcel(params: QueryVisitPlanDto): Promise<Buffer> {
    const visitPlans = await this.findAllForExport(params);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Visit Plans');

    worksheet.columns = [
      { header: 'Scheduled Date', key: 'scheduledDate', width: 18 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Assigned To', key: 'assignedTo', width: 20 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Visit Type', key: 'visitType', width: 15 },
      { header: 'Location', key: 'location', width: 35 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    visitPlans.forEach((visitPlan) => {
      worksheet.addRow({
        scheduledDate: dayjs(visitPlan.scheduledDate).format('DD-MM-YYYY'),
        title: visitPlan.title,
        assignedTo: visitPlan.User?.name || '-',
        customer: visitPlan.Customer?.name || '-',
        status: visitPlan.status,
        visitType: visitPlan.visitType,
        location: this.getVisitLocation(visitPlan),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async findOne(id: number) {
    const visitPlan = await this.prisma.visitPlan.findFirst({
      where: { id, deletedAt: null },
      include: {
        Company: true,
        Customer: true,
        User: true,
        Contact: true,
      },
    });

    if (!visitPlan) {
      throw new NotFoundException(`Visit plan with ID ${id} not found`);
    }

    return visitPlan;
  }

  async update(id: number, data: UpdateVisitPlanDto) {
    await this.findOne(id); // Verify visit plan exists

    return this.prisma.visitPlan.update({
      data,
      where: { id },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify visit plan exists

    // Soft delete
    return this.prisma.visitPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async complete(id: number, outcome?: string) {
    await this.findOne(id);

    return this.prisma.visitPlan.update({
      where: { id },
      data: {
        status: VisitPlanStatus.Completed,
        actualVisitDate: new Date(),
        outcome,
      },
      include: {
        Company: { select: { id: true, name: true } },
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        Contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
          },
        },
      },
    });
  }
}
