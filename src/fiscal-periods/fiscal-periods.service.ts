import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFiscalPeriodDto } from './fiscal-periods.dto';

@Injectable()
export class FiscalPeriodsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateFiscalPeriodDto) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (startDate > endDate) {
      throw new BadRequestException('startDate must be on or before endDate');
    }
    return this.prisma.$transaction(async (tx) => {
      const overlap = await tx.fiscalPeriod.findFirst({
        where: { startDate: { lte: endDate }, endDate: { gte: startDate } },
      });
      if (overlap) {
        throw new BadRequestException(
          `Period dates overlap with "${overlap.name}"`,
        );
      }
      return tx.fiscalPeriod.create({
        data: { name: data.name, startDate, endDate },
      });
    });
  }

  findAll() {
    return this.prisma.fiscalPeriod.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { journalEntries: true } } },
    });
  }

  findOne(id: number) {
    return this.prisma.fiscalPeriod.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { journalEntries: true } } },
    });
  }

  async close(id: number, userId: number) {
    const period = await this.prisma.fiscalPeriod.findUnique({
      where: { id },
      include: {
        journalEntries: {
          where: { status: 'DRAFT' },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!period) throw new NotFoundException(`Fiscal period ${id} not found`);
    if (period.status === 'CLOSED') {
      throw new BadRequestException('Fiscal period is already closed');
    }
    if (period.journalEntries.length) {
      throw new BadRequestException(
        'Draft journal entries must be posted or removed before closing',
      );
    }
    return this.prisma.fiscalPeriod.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date(), closedById: userId },
    });
  }
}
