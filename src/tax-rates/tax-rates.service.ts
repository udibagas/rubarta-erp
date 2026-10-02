import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaxRateDto, UpdateTaxRateDto } from './tax-rates.dto';

@Injectable()
export class TaxRatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTaxRateDto) {
    await this.assertTaxAccount(data.accountId);
    return this.prisma.taxRate.create({ data });
  }

  findAll() {
    return this.prisma.taxRate.findMany({
      orderBy: { code: 'asc' },
      include: { account: true },
    });
  }

  findOne(id: number) {
    return this.prisma.taxRate.findUniqueOrThrow({
      where: { id },
      include: { account: true },
    });
  }

  async update(id: number, data: UpdateTaxRateDto) {
    if (data.accountId !== undefined)
      await this.assertTaxAccount(data.accountId);
    return this.prisma.taxRate.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.taxRate.delete({ where: { id } });
  }

  private async assertTaxAccount(accountId: number) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account)
      throw new BadRequestException('Tax GL account does not exist');
    if (!account.isActive || !account.isPostable) {
      throw new BadRequestException(
        'Tax GL account must be active and postable',
      );
    }
  }
}
