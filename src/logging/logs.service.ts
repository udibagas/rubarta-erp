import { Injectable } from '@nestjs/common';
import { Prisma } from '../prisma/client/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryLogsDto } from './logs.dto';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLogsDto) {
    const limit = query.limit ?? 50;
    const where: Prisma.AppLogWhereInput = {};

    if (query.level) where.level = query.level;
    if (query.context) where.context = query.context;
    if (query.search)
      where.message = { contains: query.search, mode: 'insensitive' };
    if (query.from || query.to)
      where.createdAt = { gte: query.from, lte: query.to };
    if (query.cursor) where.id = { lt: BigInt(query.cursor) };

    const rows = await this.prisma.appLog.findMany({
      where,
      orderBy: { id: 'desc' },
      take: limit + 1,
    });

    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit).map((row) => ({
      ...row,
      id: row.id.toString(),
    }));

    return {
      data,
      nextCursor: hasMore ? data[data.length - 1].id : null,
    };
  }
}
