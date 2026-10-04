import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { QuotationType } from './quotation.type';
import { Prisma, QuotationStatus } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';

@Resolver(() => QuotationType)
export class QuotationsResolver {
  constructor(private readonly prisma: PrismaService) {}

  @Query(() => [QuotationType], {
    name: 'quotations',
    description: 'Get all quotations',
  })
  async findAll(
    @Args('keyword', { nullable: true }) keyword?: string,
    @Args('customerId', { type: () => Int, nullable: true })
    customerId?: number,
    @Args('opportunityId', { type: () => Int, nullable: true })
    opportunityId?: number,
    @Args('status', { type: () => QuotationStatus, nullable: true })
    status?: QuotationStatus,
  ) {
    const where: Prisma.QuotationWhereInput = {
      deletedAt: null,
    };

    if (keyword) {
      where.OR = [
        { number: { contains: keyword, mode: 'insensitive' } },
        { title: { contains: keyword, mode: 'insensitive' } },
        {
          Customer: { name: { contains: keyword, mode: 'insensitive' } },
        },
      ];
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (opportunityId) {
      where.opportunityId = opportunityId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.quotation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        Customer: { select: { id: true, name: true } },
        User: { select: { id: true, name: true } },
        QuotationItems: true,
        _count: {
          select: { QuotationItems: true },
        },
      },
    });
  }
}
