import { Injectable } from '@nestjs/common';
import { CloseNkpDto, NkpDto, QueryNkpDto } from './nkp.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  ApprovalStatus,
  ApprovalType,
  Nkp,
  NkpApproval,
  NkpType,
  PaymentStatus,
  PaymentType,
  Prisma,
  Role,
  User,
} from '../prisma/client/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications/notifications.service';
import * as ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { createPdfDocumentWithTables } from 'pdfkit-table';
import { formatDateNumeric } from '../helpers/date';
import { toDecimal } from '../helpers/number';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NkpPolicy } from './nkp.policy';

@Injectable()
export class NkpService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private notification: NotificationsService,
    private policy: NkpPolicy,
  ) {}

  async create(dto: NkpDto, user: User) {
    this.policy.can('create', null, user);
    const { NkpItem: items, NkpAttachment: attachments, ...data } = dto;
    let number = 'DRAFT';

    if (data.status == PaymentStatus.SUBMITTED) {
      const { companyId, paymentType, nkpType, parentId } = data;
      number = await this.generateNumber({
        companyId,
        paymentType,
        nkpType,
        parentId,
      });
    }

    const savedData = await this.prisma.nkp.create({
      include: { Requester: true },
      data: {
        ...data,
        requesterId: user.id,
        number,
        NkpItem: {
          create: items.map((i) => ({
            ...i,
            date: new Date(i.date),
          })),
        },
        NkpAttachment: { create: attachments },
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('nkp.submitted', savedData);
    }

    return savedData;
  }

  async findAll(params: QueryNkpDto, user?: User) {
    this.policy.can('viewAny', null, user);
    const {
      page,
      pageSize,
      companyId,
      status,
      keyword,
      paymentType,
      dateRange,
      action,
      orderBy = 'updatedAt',
      orderDirection = 'desc',
    } = params;

    const where: Prisma.NkpWhereInput = {};

    if (companyId) {
      where.companyId = +companyId;
    }

    if (Array.isArray(status) && status.length > 0) {
      where.status = { in: status };
    }

    if (status && typeof status == 'string') {
      where.status = status;
    }

    // jika bukan admin, maka hanya bisa melihat data yang dia buat atau data yang dia sebagai employee
    if (user && !user.roles.some((role) => role === Role.ADMIN)) {
      where.OR = [{ requesterId: user.id }, { employeeId: user.id }];
    }

    if (
      paymentType &&
      [
        PaymentType.EMPLOYEE,
        PaymentType.VENDOR,
        PaymentType.TRANSFER_BALANCE,
        PaymentType.TAX,
        PaymentType.BILL,
      ].includes(paymentType as PaymentType)
    ) {
      where.paymentType = paymentType as PaymentType;
    }

    if (dateRange && dateRange !== 'null') {
      const [start, end] =
        typeof dateRange == 'object' ? dateRange : dateRange.split(',');
      where.date = { gte: new Date(start), lte: new Date(end) };
    }

    // kalau ga ada page asumsi dari report
    if (action) {
      where.status = { not: 'DRAFT' };
    }

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
        { bankRefNo: { contains: keyword, mode: 'insensitive' } },
        { invoiceNumber: { contains: keyword, mode: 'insensitive' } },
        {
          Employee: {
            name: { contains: keyword, mode: 'insensitive' },
          },
        },
        {
          Supplier: {
            name: { contains: keyword, mode: 'insensitive' },
          },
        },
      ];
    }

    const options: Prisma.NkpFindManyArgs = {
      where,
      orderBy: { [orderBy]: orderDirection },
      include: {
        Employee: { select: { name: true } },
        Supplier: { select: { name: true } },
        Requester: { select: { name: true } },
        Bank: { select: { code: true, name: true } },
        Company: { select: { name: true } },
        Child: { select: { id: true, number: true, finalPayment: true } },
        Parent: { select: { id: true, number: true, finalPayment: true } },
        NkpAttachment: {
          select: {
            fileName: true,
            fileType: true,
            filePath: true,
            fileSize: true,
          },
        },
      },
    };

    if (!action || action == 'report') {
      options.take = Number(pageSize);
      options.skip = (Number(page) - 1) * Number(pageSize);
    }

    const data = await this.prisma.nkp.findMany(options);
    const total = await this.prisma.nkp.count({ where });
    return { data, page, total };
  }

  async exportReportToPdf(params: QueryNkpDto, user: User): Promise<Buffer> {
    const result = await this.findAll(
      {
        ...params,
        orderBy: 'number',
        orderDirection: 'asc',
        action: 'download',
      },
      user,
    );
    const company = await this.prisma.company.findUniqueOrThrow({
      where: { id: Number(params.companyId) },
    });
    const PDFDocumentWithTables = createPdfDocumentWithTables(PDFDocument);
    const doc = new PDFDocumentWithTables({
      size: 'A4',
      margin: 40,
      layout: 'landscape',
    });
    const headers = [
      { label: 'NO', property: 'no', align: 'center' as const, width: 35 },
      { label: 'DATE', property: 'date', align: 'center' as const, width: 65 },
      {
        label: 'NUMBER',
        property: 'number',
        align: 'center' as const,
        width: 115,
      },
      {
        label: 'BANK REF NO',
        property: 'bankRefNo',
        width: 105,
      },
      {
        label: 'DESCRIPTION',
        property: 'description',
        align: 'left' as const,
        width: 230,
      },
      {
        label: 'AMOUNT',
        property: 'amount',
        align: 'right' as const,
        width: 90,
      },
      {
        label: 'CURR',
        property: 'currency',
        align: 'center' as const,
        width: 45,
      },
    ];
    const totalColumnWidth = headers.reduce(
      (sum, header) => sum + header.width,
      0,
    );
    const availableWidth = doc.page.width - 80;
    const rows = result.data.map((item, index) => ({
      no: index + 1,
      date: item.date ? formatDateNumeric(item.date) : '',
      number: item.number || '',
      bankRefNo: item.bankRefNo || '',
      description: item.description || '',
      amount: toDecimal(
        item.finalPayment > 0 ? item.finalPayment : item.grandTotal,
      ),
      currency: item.currency || '',
    }));

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('LAPORAN NKP', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).text(company.name.toUpperCase(), { align: 'center' });
      doc.moveDown(0.8);
      doc.font('Helvetica').fontSize(10);
      doc.text(`TYPE: ${params.paymentType || 'ALL'}`);
      doc.text(`DATE: ${params.dateRange || ''}`);
      doc.moveDown(0.8);
      doc.table(
        {
          headers: headers.map((header) => ({
            ...header,
            width: (header.width / totalColumnWidth) * availableWidth,
          })),
          data: rows,
        },
        { x: 40, width: availableWidth },
      );
      doc.end();
    });
  }

  async exportReportToExcel(params: QueryNkpDto, user: User): Promise<Buffer> {
    const result = await this.findAll(
      {
        ...params,
        orderBy: 'number',
        orderDirection: 'asc',
        action: 'download',
      },
      user,
    );
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('NKP Report');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Number', key: 'number', width: 30 },
      { header: 'Type', key: 'type', width: 30 },
      { header: 'Bank Ref No.', key: 'bankRefNo', width: 30 },
      { header: 'Invoice No.', key: 'invoiceNumber', width: 30 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Curr', key: 'curr', width: 10 },
    ];
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' },
    };

    result.data.forEach((item, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        date: item.createdAt ? formatDateNumeric(item.createdAt) : '',
        number: item.number || '',
        type: `${item.paymentType} / ${item.nkpType}`,
        bankRefNo: item.bankRefNo || '',
        invoiceNumber: item.invoiceNumber || '',
        description: item.description || '',
        amount: item.finalPayment > 0 ? item.finalPayment : item.grandTotal,
        curr: item.currency || '',
      });

      if (index % 2 === 1) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F5F5' },
        };
      }
    });

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  async findOne(id: any, user?: User) {
    const where: Prisma.NkpWhereInput = {};
    if (typeof id == 'number') where.id = id;
    if (typeof id == 'string') where.number = id;

    const nkp = await this.prisma.nkp.findFirstOrThrow({
      where,
      include: {
        NkpItem: true,
        NkpApproval: {
          orderBy: { level: 'asc' },
          include: {
            User: {
              select: { name: true, signatureSpeciment: true },
            },
          },
        },
        Requester: { select: { name: true } },
        Employee: { select: { name: true } },
        Supplier: { select: { name: true } },
        Company: { select: { name: true } },
        Bank: { select: { code: true, name: true } },
        Child: { select: { id: true, number: true, finalPayment: true } },
        Parent: { select: { id: true, number: true, finalPayment: true } },
        NkpAttachment: {
          select: {
            fileName: true,
            fileType: true,
            filePath: true,
            fileSize: true,
          },
        },
      },
    });

    // this.policy.can('view', nkp, user);
    return nkp;
  }

  async update(id: number, dto: NkpDto, user: User) {
    const nkp = await this.prisma.nkp.findUniqueOrThrow({
      where: { id },
    });

    this.policy.can('update', nkp, user);

    let number = 'DRAFT';
    if (dto.status == PaymentStatus.SUBMITTED) {
      const { companyId, paymentType, nkpType, parentId } = dto;
      number = await this.generateNumber({
        companyId,
        paymentType,
        nkpType,
        parentId,
      });
    }

    const { NkpItem: items, NkpAttachment: attachments, ...data } = dto;
    const savedData = await this.prisma.nkp.update({
      where: { id },
      data: {
        ...data,
        number,
        NkpItem: {
          deleteMany: {},
          create: items.map((i) => ({
            ...i,
            date: new Date(i.date),
          })),
        },
        NkpAttachment: { deleteMany: {}, create: attachments },
      },
      include: {
        NkpItem: true,
        Requester: true,
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('nkp.submitted', savedData);
    }

    return savedData;
  }

  async submit(id: number, user: User) {
    const nkp = await this.prisma.nkp.findUniqueOrThrow({
      where: { id },
    });

    this.policy.can('update', nkp, user);
    const { companyId, paymentType, nkpType, parentId } = nkp;
    const number = await this.generateNumber({
      companyId,
      paymentType,
      nkpType,
      parentId,
    });

    const savedData = await this.prisma.nkp.update({
      where: { id, requesterId: user.id },
      data: {
        number,
        status: PaymentStatus.SUBMITTED,
      },
    });

    this.eventEmitter.emit('nkp.submitted', savedData);
    return savedData;
  }

  async remove(id: number, user: User) {
    const nkp = await this.prisma.nkp.findUniqueOrThrow({
      where: { id },
    });

    this.policy.can('delete', nkp, user);

    return this.prisma.nkp.delete({
      where: { id },
    });
  }

  async removeItem(id: number, itemId: number, user: User) {
    const nkp = await this.prisma.nkp.findUniqueOrThrow({
      where: { id },
    });

    // this.policy.can('delete', nkp, user);
    return this.prisma.nkpItem.delete({
      where: { id: itemId },
    });
  }

  async approve(id: number, userId: number, note?: string) {
    const approval = await this.prisma.nkpApproval.findFirstOrThrow({
      where: { nkpId: id, userId, approvalStatus: null },
      include: { Nkp: true, User: true },
    });

    const data = await this.prisma.nkpApproval.update({
      data: { approvalStatus: ApprovalStatus.APPROVED, note: note },
      where: { id: approval.id },
    });

    const pendingApprovalCount = await this.prisma.nkpApproval.count({
      where: { nkpId: id, approvalStatus: null },
    });

    const status = pendingApprovalCount
      ? PaymentStatus.PARTIALLY_APPROVED
      : PaymentStatus.FULLY_APPROVED;

    await this.prisma.nkp.update({
      data: { status },
      where: { id },
    });

    // TODO: Lanjut ke approval berikutnya
    const request = approval.Nkp;

    // NOTIFIKASI KE EMPLOYEE ATAU KE REQUESTER
    const { paymentType, employeeId, requesterId } = approval.Nkp;

    this.notification.notify({
      userId: paymentType == 'EMPLOYEE' ? employeeId : requesterId,
      title: `NKP Nomor ${request.number} Telah Disetujui`,
      message: `NKP Nomor ${request.number} telah disetujui oleh ${approval.User.name}`,
      redirectUrl: `https://erp.rubarta.co.id/nkp?number=${request.number}`,
    });

    if (!pendingApprovalCount) {
      // NOTIFIKASI KE EMPLOYEE ATAU KE REQUESTER
      this.notification.notify({
        userId: paymentType == 'EMPLOYEE' ? employeeId : requesterId,
        title: `NKP Nomor ${request.number} Telah Disetujui Sepenuhnya`,
        message: `NKP Nomor ${request.number} telah disetujui sepenuhnya. Proses pembayaran akan segera diproses. Mohon tunggu.`,
        redirectUrl: `https://erp.rubarta.co.id/nkp?number=${request.number}`,
      });

      const approvers = await this.prisma.nkpApproval.findMany({
        where: {
          nkpId: id,
        },
      });

      // NOTIFIKASI KE ADMIN UNTUK PROSES PEMBAYARAN & CLOSING
      // ke admin yg related
      const admins = await this.prisma.user.findMany({
        where: {
          roles: { hasSome: [Role.ADMIN] },
          id: { in: approvers.map((a) => a.userId) },
        },
      });

      admins.forEach((user) => {
        this.notification.notify({
          userId: user.id,
          title: `NKP Nomor ${request.number} Telah Disetujui Sepenuhnya`,
          message: `NKP Nomor ${request.number} telah disetujui sepenuhnya. Silakan lanjutkan ke proses berikutnya`,
          redirectUrl: `https://erp.rubarta.co.id/nkp?number=${request.number}`,
        });
      });
    }

    return data;
  }

  async close(id: number, data: CloseNkpDto, user: User) {
    const existingNkp = await this.prisma.nkp.findUniqueOrThrow({
      where: { id },
    });

    // this.policy.can('close', existingNkp, user);
    const { bankRefNo, attachments } = data;

    const request = await this.prisma.nkp.update({
      data: {
        status: PaymentStatus.CLOSED,
        bankRefNo,
        NkpAttachment: attachments.length
          ? { createMany: { data: attachments } }
          : {},
      },
      where: { id },
    });

    this.notification.notify({
      userId:
        request.paymentType == 'EMPLOYEE'
          ? request.employeeId
          : request.requesterId,
      title: `NKP Nomor ${request.number} Telah Selesai Diproses`,
      message: `NKP Nomor ${request.number} telah selesai diproses dengan nomor referensi bank sebagai berikut: ${request.bankRefNo}`,
      redirectUrl: `https://erp.rubarta.co.id/nkp?number=${request.number}`,
    });

    // add to employee balance
    const nkp = await this.prisma.nkp.findFirst({
      where: { id },
      include: { Employee: true },
    });

    if (nkp.paymentType == PaymentType.EMPLOYEE)
      await this.updateUserBalance(nkp);

    if (nkp.goodsReceiptId) {
      const gr = await this.prisma.goodsReceipt.findUnique({
        where: { id: nkp.goodsReceiptId },
      });

      if (gr) {
        await this.prisma.goodsReceipt.update({
          where: { id: gr.id },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });

        const po = await this.prisma.purchaseOrder.findUnique({
          where: { id: gr.purchaseOrderId },
        });

        if (po) {
          const paymentAmount = po.paymentAmount + nkp.finalPayment;
          const paymentStatus =
            paymentAmount >= po.grandTotal
              ? PaymentStatus.PAID
              : PaymentStatus.PARTIAL;

          await this.prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { paymentAmount, paymentStatus },
          });
        }
      }
    }

    return request;
  }

  private async updateUserBalance(nkp: Nkp) {
    const employeeBalance = await this.prisma.userBalance.upsert({
      where: { userId: nkp.employeeId },
      update: {},
      create: { userId: nkp.employeeId, balance: 0 },
    });

    const balance = employeeBalance.balance;

    // kalau dia cash advance tambahin balance
    if (nkp.nkpType == NkpType.CASH_ADVANCE) {
      await this.prisma.userBalance.update({
        where: { userId: nkp.employeeId },
        data: {
          description: nkp.number,
          balance: balance + nkp.finalPayment,
        },
      });
    }

    // kalau dia deklarasi dan ada yg harus dikebmalikan ke perusahaan
    // update balance sesuai dengan jumlah yang harus dikembalikan ke perusahaan
    if (nkp.nkpType == NkpType.DECLARATION) {
      await this.prisma.userBalance.update({
        where: { userId: nkp.employeeId },
        data: {
          description: nkp.number,
          // kalau kembali ke perusahaan jadikan sebagai balance
          // kalau pas atau kembali ke karyawan berarti balance habis
          balance: nkp.finalPayment < 0 ? Math.abs(nkp.finalPayment) : 0,
        },
      });
    }
  }

  async getDownPayment(id: number) {
    const nkp = await this.prisma.nkp.findFirst({ where: { id } });

    if (nkp) {
      return (
        await this.prisma.nkp.aggregate({
          _sum: { finalPayment: true },
          where: { number: nkp.number, nkpType: 'DOWN_PAYMENT' },
        })
      )._sum.finalPayment;
    }

    return 0;
  }

  private async generateNumber({
    companyId,
    paymentType,
    nkpType,
    parentId,
  }: {
    companyId: number;
    paymentType: PaymentType;
    nkpType: NkpType;
    parentId: number | undefined;
  }): Promise<string> {
    const { code } = await this.prisma.company.findUniqueOrThrow({
      where: { id: companyId },
    });

    // const bank = 'DNM'; // TODO: apakah harusnya dinamis? DNM = Bank Danamon

    const paymentTypes = {
      [PaymentType.EMPLOYEE]: 'EMP',
      [PaymentType.VENDOR]: 'VEN',
    };

    const nkpTypes = {
      [NkpType.CASH_ADVANCE]: 'CA',
      [NkpType.DECLARATION]: 'DCL',
      [NkpType.SALARY]: 'SLR',
      [NkpType.DOWN_PAYMENT]: 'DP',
      [NkpType.SETTLEMENT]: 'STL',
    };

    const type = `${paymentTypes[paymentType]}-${nkpTypes[nkpType]}`;

    const [month, year] = new Date()
      .toLocaleString('id-ID', {
        month: 'numeric',
        year: 'numeric',
      })
      .split('/');

    let number = '0001';

    if (parentId) {
      const parent = await this.findOne(parentId);
      number = parent.number.split('/')[0];
    } else {
      const lastData = await this.prisma.nkp.findFirst({
        orderBy: { number: 'desc' },
        where: {
          companyId,
          AND: [{ number: { endsWith: year } }, { number: { not: 'DRAFT' } }],
        },
      });

      if (lastData) {
        const [lastNumber] = lastData.number.split('/');
        number = (Number(lastNumber) + 1).toString().padStart(4, '0');
      }
    }

    const romanMonth = [
      '',
      'I',
      'II',
      'III',
      'IV',
      'V',
      'VI',
      'VII',
      'VIII',
      'IX',
      'X',
      'XI',
      'XII',
    ][+month];

    return `${number}/NKP-${type}-${code}/${romanMonth}/${year}`;
  }

  @OnEvent('nkp.submitted', { async: true })
  async requestForApproval(data: Nkp) {
    const approval = await this.prisma.approvalSetting.findFirst({
      where: {
        approvalType: ApprovalType.NKP,
        companyId: data.companyId,
        paymentType: data.paymentType,
        nkpType: data.nkpType,
      },
      include: { ApprovalSettingItem: true },
    });

    if (!approval) return;

    await this.prisma.nkpApproval.createMany({
      data: approval.ApprovalSettingItem.map((el) => ({
        userId: el.userId,
        approvalActionType: el.approvalActionType,
        level: el.level,
        nkpId: data.id,
      })),
    });

    // Ambil user approval dengan level 1
    const firstLevelApprovals = await this.prisma.nkpApproval.findMany({
      where: {
        nkpId: data.id,
        // level: 1, // TODO: harusnya berjenjang, sementara paralel untuk testing
      },
    });

    if (firstLevelApprovals.length > 0) {
      firstLevelApprovals.forEach((approval) => {
        this.eventEmitter.emit('nkp.notify', {
          data,
          approval,
        });
      });
    }
  }

  @OnEvent('nkp.notify', { async: true })
  sendNotification(params: { data: Nkp; approval: NkpApproval }) {
    const { data, approval } = params;
    const approvalAction = {
      APPROVAL: 'Persetujuan',
      VERIFICATION: 'Verifikasi',
      AUTHORIZATION: 'Otorisasi',
    };

    const action = `${approvalAction[approval.approvalActionType]}`;

    this.notification.notify({
      userId: approval.userId,
      title: `Permintaan ${action}: ${data.number}`,
      message: `Anda mendapatkan permintaan ${action} untuk Nota Kuasa Pembayaran dengan nomor ${data.number}.`,
      redirectUrl: `https://erp.rubarta.co.id/nkp?number=${data.number}`,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async notifyPendingApproval() {
    const pendingApprovals = await this.prisma.nkpApproval.findMany({
      where: {
        approvalStatus: null,
      },
      include: {
        Nkp: {
          select: {
            number: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    for (const approval of pendingApprovals) {
      console.log(
        `Notifying user ${approval.User.name} about pending approval for NKP with document number ${approval.Nkp.number}`,
      );

      this.notification.notify({
        userId: approval.userId,
        title: `[Pengingat] Permintaan Persetujuan NKP #${approval.Nkp.number}`,
        message: `Anda memiliki permintaan persetujuan yang belum disetujui untuk NKP dengan nomor ${approval.Nkp.number}`,
        redirectUrl: `https://erp.rubarta.co.id/nkp?number=${approval.Nkp.number}`,
      });
    }
  }
}
