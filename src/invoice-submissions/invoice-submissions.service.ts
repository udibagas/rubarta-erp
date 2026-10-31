import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceSubmissionStatus, Prisma, User } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInvoiceSubmissionDto,
  QueryInvoiceSubmissionsDto,
  UpdateInvoiceSubmissionDto,
  UpdateInvoiceSubmissionStatusDto,
} from './invoice-submissions.dto';
import { InvoiceSubmissionsPolicy } from './invoice-submissions.policy';
import dayjs from 'dayjs';

const submissionInclude = {
  Customer: {
    select: { name: true },
  },
  User: { select: { name: true } },
  invoiceSubmissionItems: { include: { Invoice: true } },
} satisfies Prisma.InvoiceSubmissionInclude;

@Injectable()
export class InvoiceSubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: InvoiceSubmissionsPolicy,
  ) {}

  async create(data: CreateInvoiceSubmissionDto, user: User) {
    this.policy.can('create', null, user);
    const { invoiceIds, ...submissionData } = data;
    const number = await this.generateNumber();

    const amount = await this.prisma.invoice
      .aggregate({
        _sum: { grandTotal: true },
        where: { id: { in: invoiceIds ?? [] } },
      })
      .then((res) => res._sum.grandTotal ?? 0);

    return this.prisma.invoiceSubmission.create({
      data: {
        ...submissionData,
        userId: user.id,
        number,
        amount,
        invoiceSubmissionItems: {
          create: (invoiceIds ?? []).map((invoiceId) => ({
            Invoice: { connect: { id: invoiceId } },
          })),
        },
      },
      include: submissionInclude,
    });
  }

  findAll(query: QueryInvoiceSubmissionsDto, user: User) {
    this.policy.can('viewAny', null, user);
    const where: Prisma.InvoiceSubmissionWhereInput = {
      status: query.status,
      customerId: query.customerId ? Number(query.customerId) : undefined,
      ...(user.roles.includes('ADMIN') ? {} : { userId: user.id }),
    };

    return this.prisma.invoiceSubmission.findMany({
      where,
      orderBy: [{ date: 'desc' }, { number: 'desc' }],
      include: submissionInclude,
    });
  }

  async findOne(id: number, user: User) {
    const submission = await this.prisma.invoiceSubmission.findUnique({
      where: { id },
      include: submissionInclude,
    });
    if (!submission) {
      throw new NotFoundException(`Invoice submission ${id} not found`);
    }
    this.policy.can('view', submission, user);
    return submission;
  }

  async update(id: number, data: UpdateInvoiceSubmissionDto, user: User) {
    const submission = await this.findForMutation(id);
    this.policy.can('update', submission, user);
    const { invoiceIds, ...submissionData } = data;

    const amount = await this.prisma.invoice
      .aggregate({
        _sum: { grandTotal: true },
        where: { id: { in: invoiceIds ?? [] } },
      })
      .then((res) => res._sum.grandTotal ?? 0);

    return this.prisma.invoiceSubmission.update({
      where: { id },
      data: {
        ...submissionData,
        amount,
        ...(invoiceIds === undefined
          ? {}
          : {
              invoiceSubmissionItems: {
                deleteMany: {},
                create: invoiceIds.map((invoiceId) => ({
                  Invoice: { connect: { id: invoiceId } },
                })),
              },
            }),
      },
      include: submissionInclude,
    });
  }

  async updateStatus(
    id: number,
    data: UpdateInvoiceSubmissionStatusDto,
    user: User,
  ) {
    const submission = await this.findForMutation(id);
    this.policy.can('status', submission, user);
    const nextStatus: Partial<
      Record<InvoiceSubmissionStatus, InvoiceSubmissionStatus>
    > = {
      Draft: InvoiceSubmissionStatus.Submitted,
      Submitted: InvoiceSubmissionStatus.Received,
      Received: InvoiceSubmissionStatus.Paid,
    };
    if (nextStatus[submission.status] !== data.status) {
      throw new BadRequestException(
        `Cannot change invoice submission status from ${submission.status} to ${data.status}`,
      );
    }

    const timestampField = {
      Submitted: 'submittedAt',
      Received: 'receivedAt',
      Paid: 'paidAt',
    } as const;
    const field = timestampField[data.status];
    return this.prisma.invoiceSubmission.update({
      where: { id },
      data: { status: data.status, [field]: new Date() },
      include: submissionInclude,
    });
  }

  async remove(id: number, user: User) {
    const submission = await this.findForMutation(id);
    this.policy.can('delete', submission, user);
    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceSubmissionItem.deleteMany({
        where: { invoiceSubmissionId: id },
      });
      return tx.invoiceSubmission.delete({ where: { id } });
    });
  }

  private async findForMutation(id: number) {
    const submission = await this.prisma.invoiceSubmission.findUnique({
      where: { id },
    });
    if (!submission) {
      throw new NotFoundException(`Invoice submission ${id} not found`);
    }
    return submission;
  }

  private async generateNumber(): Promise<string> {
    const lastSubmission = await this.prisma.invoiceSubmission.findFirst({
      orderBy: { id: 'desc' },
    });

    const monthYear = dayjs().format('MMYYYY');
    const lastNumber = lastSubmission
      ? parseInt(lastSubmission.number.split('-').pop())
      : 0;

    const newNumber = lastNumber + 1;
    return `IS${monthYear}-${newNumber}`;
  }
}
