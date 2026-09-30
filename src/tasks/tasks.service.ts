import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './task.dto';
import { Prisma, TaskStatus, PaymentStatus } from '../prisma/client/client';

export interface DraftDocument {
  id: number;
  documentType: string;
  date: Date | null;
  number: string | null;
  title: string | null;
  party: string | null;
  pic: string | null;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaskDto) {
    return this.prisma.task.create({
      data,
      include: {
        User: { select: { id: true, name: true } },
      },
    });
  }

  async findAll(query: QueryTaskDto) {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    if (query.userId) {
      where.userId = Number(query.userId);
    }

    if (query.leadId) {
      where.leadId = Number(query.leadId);
    }

    if (query.opportunityId) {
      where.opportunityId = Number(query.opportunityId);
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        where.status = { in: query.status };
      } else {
        where.status = query.status;
      }
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    if (query.keyword) {
      where.OR = [
        { title: { contains: query.keyword, mode: 'insensitive' } },
        { description: { contains: query.keyword, mode: 'insensitive' } },
      ];
    }

    const orderBy = [
      { priority: 'desc' },
      { dueDate: 'asc' },
    ] as Prisma.TaskOrderByWithRelationInput[];

    if (query.sortBy) {
      const sortOrder = query.sortOrder || 'asc';
      orderBy.unshift({ [query.sortBy]: sortOrder });
    }

    const include = {
      User: { select: { id: true, name: true } },
    };

    if (query.page && query.pageSize) {
      const page = Number(query.page) || 1;
      const take = Number(query.pageSize) || 10;
      const skip = (page - 1) * take;

      const [data, total] = await Promise.all([
        this.prisma.task.findMany({
          where,
          orderBy,
          include,
          skip,
          take,
        }),

        this.prisma.task.count({ where }),
      ]);

      return { data, total };
    }

    // Return all results without pagination
    return this.prisma.task.findMany({ where, orderBy, include });
  }

  async findOne(id: number) {
    const task = await this.prisma.task.findFirst({
      where: { id, deletedAt: null },
      include: {
        User: true,
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: number, data: UpdateTaskDto) {
    await this.findOne(id); // Verify exists

    // If status is changed to Completed, set completedAt
    if (data.status === TaskStatus.Completed) {
      data['completedAt'] = new Date();
    }

    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        User: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Verify exists

    // Soft delete
    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async summary(query: QueryTaskDto) {
    const where: Prisma.TaskWhereInput = {
      deletedAt: null,
    };

    if (query.userId) {
      where.userId = Number(query.userId);
    }

    if (query.leadId) {
      where.leadId = Number(query.leadId);
    }

    if (query.opportunityId) {
      where.opportunityId = Number(query.opportunityId);
    }

    if (query.status) {
      if (Array.isArray(query.status)) {
        where.status = { in: query.status };
      } else {
        where.status = query.status;
      }
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const [total, completed, overdue] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({
        where: { ...where, status: TaskStatus.Completed },
      }),
      this.prisma.task.count({
        where: {
          ...where,
          dueDate: { lt: new Date() },
          status: { not: TaskStatus.Completed },
        },
      }),
    ]);

    return { total, completed, overdue, pending: total - completed };
  }

  // Aggregates all Draft documents across Nkp, Invoice, Sales Order, Quotation,
  // Purchase Order, Delivery Order and Goods Receipt into a single unified list.
  async getDraftDocuments(): Promise<DraftDocument[]> {
    const [
      nkps,
      invoices,
      salesOrders,
      quotations,
      purchaseOrders,
      deliveryOrders,
      goodsReceipts,
    ] = await Promise.all([
      this.prisma.nkp.findMany({
        where: { status: PaymentStatus.DRAFT },
        select: {
          id: true,
          date: true,
          number: true,
          description: true,
          Supplier: { select: { name: true } },
          Employee: { select: { name: true } },
          Requester: { select: { name: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          date: true,
          number: true,
          Customer: { select: { name: true } },
          User: { select: { name: true } },
        },
      }),
      this.prisma.salesOrder.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          date: true,
          number: true,
          title: true,
          Customer: { select: { name: true } },
          User: { select: { name: true } },
        },
      }),
      this.prisma.quotation.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          date: true,
          number: true,
          title: true,
          Customer: { select: { name: true } },
          User: { select: { name: true } },
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          date: true,
          number: true,
          title: true,
          Supplier: { select: { name: true } },
          User: { select: { name: true } },
        },
      }),
      this.prisma.deliveryOrder.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          date: true,
          number: true,
          Customer: { select: { name: true } },
          User: { select: { name: true } },
        },
      }),
      this.prisma.goodsReceipt.findMany({
        where: { status: 'Draft' },
        select: {
          id: true,
          date: true,
          number: true,
          Supplier: { select: { name: true } },
          User: { select: { name: true } },
        },
      }),
    ]);

    const draftDocuments: DraftDocument[] = [
      ...nkps.map((nkp) => ({
        documentType: 'NKP',
        id: nkp.id,
        date: nkp.date,
        number: nkp.number,
        title: nkp.description,
        party: nkp.Supplier?.name ?? nkp.Employee?.name ?? null,
        pic: nkp.Requester?.name ?? null,
      })),
      ...invoices.map((invoice) => ({
        documentType: 'Invoice',
        id: invoice.id,
        date: invoice.date,
        number: invoice.number,
        title: null,
        party: invoice.Customer?.name ?? null,
        pic: invoice.User?.name ?? null,
      })),
      ...salesOrders.map((salesOrder) => ({
        documentType: 'Sales Order',
        id: salesOrder.id,
        date: salesOrder.date,
        number: salesOrder.number,
        title: salesOrder.title,
        party: salesOrder.Customer?.name ?? null,
        pic: salesOrder.User?.name ?? null,
      })),
      ...quotations.map((quotation) => ({
        documentType: 'Quotation',
        id: quotation.id,
        date: quotation.date,
        number: quotation.number,
        title: quotation.title,
        party: quotation.Customer?.name ?? null,
        pic: quotation.User?.name ?? null,
      })),
      ...purchaseOrders.map((purchaseOrder) => ({
        documentType: 'Purchase Order',
        id: purchaseOrder.id,
        date: purchaseOrder.date,
        number: purchaseOrder.number,
        title: purchaseOrder.title,
        party: purchaseOrder.Supplier?.name ?? null,
        pic: purchaseOrder.User?.name ?? null,
      })),
      ...deliveryOrders.map((deliveryOrder) => ({
        documentType: 'Delivery Order',
        id: deliveryOrder.id,
        date: deliveryOrder.date,
        number: deliveryOrder.number,
        title: null,
        party: deliveryOrder.Customer?.name ?? null,
        pic: deliveryOrder.User?.name ?? null,
      })),
      ...goodsReceipts.map((goodsReceipt) => ({
        documentType: 'Goods Receipt',
        id: goodsReceipt.id,
        date: goodsReceipt.date,
        number: goodsReceipt.number,
        title: null,
        party: goodsReceipt.Supplier?.name ?? null,
        pic: goodsReceipt.User?.name ?? null,
      })),
    ];

    draftDocuments.sort(
      (a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0),
    );

    return draftDocuments;
  }
}
