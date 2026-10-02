import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateAccountDto) {
    if (data.parentId) await this.assertParent(data.parentId);
    return this.prisma.account.create({ data });
  }

  findAll() {
    return this.prisma.account.findMany({
      orderBy: { code: 'asc' },
      include: { parent: true, children: { orderBy: { code: 'asc' } } },
    });
  }

  findOne(id: number) {
    return this.prisma.account.findUniqueOrThrow({
      where: { id },
      include: { parent: true, children: { orderBy: { code: 'asc' } } },
    });
  }

  async update(id: number, data: UpdateAccountDto) {
    const account = await this.prisma.account.findUnique({ where: { id } });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    if (account.isSystem && (data.code || data.type)) {
      throw new BadRequestException(
        'System account code and type cannot change',
      );
    }
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        throw new BadRequestException('An account cannot be its own parent');
      }
      await this.assertParent(data.parentId, id);
    }
    return this.prisma.account.update({ where: { id }, data });
  }

  async remove(id: number) {
    const account = await this.prisma.account.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            journalLines: true,
            balances: true,
            taxRates: true,
          },
        },
        cashBankAccount: { select: { id: true } },
      },
    });
    if (!account) throw new NotFoundException(`Account ${id} not found`);
    if (account.isSystem) {
      throw new BadRequestException('System accounts cannot be deleted');
    }
    if (
      account._count.children ||
      account._count.journalLines ||
      account._count.balances ||
      account._count.taxRates ||
      account.cashBankAccount
    ) {
      throw new BadRequestException(
        'Accounts with child accounts or accounting history cannot be deleted',
      );
    }
    return this.prisma.account.delete({ where: { id } });
  }

  private async assertParent(parentId: number, accountId?: number) {
    const seen = new Set<number>(accountId ? [accountId] : []);
    let currentId: number | null = parentId;

    while (currentId !== null) {
      if (seen.has(currentId)) {
        throw new BadRequestException(
          'Account hierarchy cannot contain a cycle',
        );
      }
      seen.add(currentId);
      const parent: {
        id: number;
        parentId: number | null;
        isActive: boolean;
      } | null = await this.prisma.account.findUnique({
        where: { id: currentId },
        select: { id: true, parentId: true, isActive: true },
      });
      if (!parent)
        throw new NotFoundException(`Parent account ${currentId} not found`);
      if (!parent.isActive) {
        throw new BadRequestException('Inactive accounts cannot be parents');
      }
      currentId = parent.parentId;
    }
  }
}
