import { ForbiddenException, Injectable } from '@nestjs/common';
import { CloseNkpDto, NkpDto } from './nkp.dto';
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
} from '@prisma/client';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class NkpService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private notification: NotificationsService,
  ) {}

  async create(dto: NkpDto) {
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
        number,
        NkpItem: { create: items },
        NkpAttachment: { create: attachments },
      },
    });

    if (savedData.status == PaymentStatus.SUBMITTED) {
      this.eventEmitter.emit('nkp.submitted', savedData);
    }

    return savedData;
  }

  async findAll(params: {
    page: number;
    pageSize: number;
    companyId?: number;
    paymentType?: PaymentType;
    keyword?: string;
    dateRange?: any;
    action?: string;
    format?: string;
  }) {
    const {
      page,
      pageSize,
      companyId,
      keyword,
      paymentType,
      dateRange,
      action,
      format,
    } = params;

    const where: Prisma.NkpWhereInput = {};

    if (companyId) {
      where.companyId = companyId;
    }

    if (
      paymentType &&
      [PaymentType.EMPLOYEE, PaymentType.VENDOR, PaymentType.COMPANY].includes(
        paymentType,
      )
    ) {
      where.paymentType = paymentType;
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
      ];
    }

    const options: Prisma.NkpFindManyArgs = {
      where,
      orderBy: { updatedAt: 'desc' },
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
      options.take = pageSize;
      options.skip = (page - 1) * pageSize;
    }

    const data = await this.prisma.nkp.findMany(options);

    if (action == 'download') {
      if (format == 'pdf') {
        const company = await this.prisma.company.findUniqueOrThrow({
          where: { id: companyId },
        });

        return { data, company };
      }

      if (format == 'excel') return data;
    }

    const total = await this.prisma.nkp.count({ where });
    return { data, page, total };
  }

  findOne(id: any) {
    const where: Prisma.NkpWhereInput = {};
    if (typeof id == 'number') where.id = id;
    if (typeof id == 'string') where.number = id;

    return this.prisma.nkp.findFirstOrThrow({
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
  }

  async update(id: number, dto: NkpDto) {
    const existingData = await this.findOne(id);
    if (existingData.status !== PaymentStatus.DRAFT)
      throw new ForbiddenException();

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
        NkpItem: { deleteMany: {}, create: items },
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

  async submit(id: number, requesterId: number) {
    const data = await this.findOne(id);
    const { companyId, paymentType, nkpType, parentId } = data;
    const number = await this.generateNumber({
      companyId,
      paymentType,
      nkpType,
      parentId,
    });

    const savedData = await this.prisma.nkp.update({
      where: { id, requesterId },
      data: {
        number,
        status: PaymentStatus.SUBMITTED,
      },
    });

    this.eventEmitter.emit('nkp.submitted', savedData);
    return savedData;
  }

  async remove(id: number) {
    const data = await this.findOne(id);
    if (data.status !== PaymentStatus.DRAFT) throw new ForbiddenException();
    return this.prisma.nkp.delete({
      where: { id },
    });
  }

  async removeItem(id: number, itemId: number) {
    const data = await this.findOne(id);
    if (data.status !== PaymentStatus.DRAFT) throw new ForbiddenException();
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
    if (!user.roles.includes('ADMIN')) {
      throw new ForbiddenException('Anda tidak boleh melakukan aksi ini');
    }

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

    let number = '001';

    if (parentId) {
      const parent = await this.findOne(parentId);
      number = parent.number.split('/')[0];
    } else {
      const lastData = await this.prisma.nkp.findFirst({
        orderBy: { number: 'desc' },
        where: {
          number: { endsWith: year },
          companyId,
        },
      });

      if (lastData) {
        const [lastNumber] = lastData.number.split('/');
        number = (Number(lastNumber) + 1).toString().padStart(3, '0');
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
}
