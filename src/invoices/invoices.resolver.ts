import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { InvoiceType } from './invoice.type';
import { InvoiceStatus, Prisma } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => InvoiceType)
export class InvoicesResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [InvoiceType], {
    name: 'invoices',
    description: 'Get all invoices',
  })
  async findAll(
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('salesOrderId', { type: () => Int, nullable: true })
    salesOrderId?: number,
    @Args('status', { type: () => [InvoiceStatus], nullable: true })
    status?: InvoiceStatus[],
    @Args('keyword', { nullable: true }) keyword?: string,
  ) {
    const where: Prisma.InvoiceWhereInput = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (salesOrderId) {
      where.salesOrderId = salesOrderId;
    }

    if (status && status.length > 0) {
      where.status = { in: status };
    }

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { referenceNumber: { contains: keyword, mode: 'insensitive' } },
        { Customer: { name: { contains: keyword, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.invoice.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        InvoiceItems: true,
      },
    });
  }
}
