import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_RETENTION_DAYS = 30;

@Injectable()
export class LogCleanupService {
  private readonly logger = new Logger(LogCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeOldLogs() {
    const days =
      Number(process.env.LOG_RETENTION_DAYS) || DEFAULT_RETENTION_DAYS;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const { count } = await this.prisma.appLog.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    this.logger.log(`Purged ${count} log rows older than ${days} days`);
  }
}
