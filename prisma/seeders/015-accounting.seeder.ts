import { AccountType, PrismaClient } from '../../src/prisma/client/client';

const accountSeeds: {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  isSystem?: boolean;
  isPostable?: boolean;
}[] = [
  { code: '1', name: 'Assets', type: AccountType.ASSET, isPostable: false },
  {
    code: '1-1000',
    name: 'Cash and Cash Equivalents',
    type: AccountType.ASSET,
    parentCode: '1',
    isPostable: false,
  },
  {
    code: '1-1010',
    name: 'Cash on Hand',
    type: AccountType.ASSET,
    parentCode: '1-1000',
  },
  {
    code: '1-1020',
    name: 'Bank Accounts',
    type: AccountType.ASSET,
    parentCode: '1-1000',
  },
  {
    code: '1-1100',
    name: 'Accounts Receivable',
    type: AccountType.ASSET,
    parentCode: '1',
    isSystem: true,
  },
  {
    code: '1-1200',
    name: 'Inventory',
    type: AccountType.ASSET,
    parentCode: '1',
  },
  {
    code: '1-1300',
    name: 'VAT Input',
    type: AccountType.ASSET,
    parentCode: '1',
    isSystem: true,
  },
  {
    code: '1-2000',
    name: 'Fixed Assets',
    type: AccountType.ASSET,
    parentCode: '1',
    isPostable: false,
  },
  {
    code: '1-2010',
    name: 'Furniture and Equipment',
    type: AccountType.ASSET,
    parentCode: '1-2000',
  },
  {
    code: '2',
    name: 'Liabilities',
    type: AccountType.LIABILITY,
    isPostable: false,
  },
  {
    code: '2-1000',
    name: 'Accounts Payable',
    type: AccountType.LIABILITY,
    parentCode: '2',
    isSystem: true,
  },
  {
    code: '2-1100',
    name: 'VAT Output',
    type: AccountType.LIABILITY,
    parentCode: '2',
    isSystem: true,
  },
  {
    code: '2-1200',
    name: 'Withholding Tax Payable',
    type: AccountType.LIABILITY,
    parentCode: '2',
    isSystem: true,
  },
  {
    code: '2-2000',
    name: 'Accrued Expenses',
    type: AccountType.LIABILITY,
    parentCode: '2',
  },
  { code: '3', name: 'Equity', type: AccountType.EQUITY, isPostable: false },
  {
    code: '3-1000',
    name: 'Owner Capital',
    type: AccountType.EQUITY,
    parentCode: '3',
  },
  {
    code: '3-2000',
    name: 'Retained Earnings',
    type: AccountType.EQUITY,
    parentCode: '3',
    isSystem: true,
  },
  { code: '4', name: 'Revenue', type: AccountType.REVENUE, isPostable: false },
  {
    code: '4-1000',
    name: 'Sales Revenue',
    type: AccountType.REVENUE,
    parentCode: '4',
  },
  {
    code: '4-2000',
    name: 'Other Income',
    type: AccountType.REVENUE,
    parentCode: '4',
  },
  { code: '5', name: 'Expenses', type: AccountType.EXPENSE, isPostable: false },
  {
    code: '5-1000',
    name: 'Cost of Sales',
    type: AccountType.EXPENSE,
    parentCode: '5',
  },
  {
    code: '5-2000',
    name: 'Salaries and Wages',
    type: AccountType.EXPENSE,
    parentCode: '5',
  },
  {
    code: '5-3000',
    name: 'Rent Expense',
    type: AccountType.EXPENSE,
    parentCode: '5',
  },
  {
    code: '5-4000',
    name: 'Bank Charges',
    type: AccountType.EXPENSE,
    parentCode: '5',
  },
  {
    code: '5-5000',
    name: 'Office Expenses',
    type: AccountType.EXPENSE,
    parentCode: '5',
  },
];

export async function seedAccounting(prisma: PrismaClient) {
  console.log(
    '\n📚 Creating accounting chart of accounts and fiscal periods...',
  );

  const seededAccounts = new Map<string, number>();
  for (const account of accountSeeds) {
    let parentId: number | null = null;
    if (account.parentCode) {
      parentId =
        seededAccounts.get(account.parentCode) ??
        (
          await prisma.account.findUnique({
            where: { code: account.parentCode },
            select: { id: true },
          })
        )?.id ??
        null;
      if (!parentId) {
        throw new Error(`Parent account ${account.parentCode} is missing`);
      }
    }

    const saved = await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: {
        code: account.code,
        name: account.name,
        type: account.type,
        parentId,
        isSystem: account.isSystem ?? false,
        isPostable: account.isPostable ?? true,
      },
    });
    seededAccounts.set(account.code, saved.id);
  }

  const year = new Date().getUTCFullYear();
  const periods = [];
  for (let month = 0; month < 12; month += 1) {
    const startDate = new Date(Date.UTC(year, month, 1));
    const endDate = new Date(Date.UTC(year, month + 1, 0));
    const monthName = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      timeZone: 'UTC',
    }).format(startDate);
    const name = `${monthName} ${year}`;
    const existingByName = await prisma.fiscalPeriod.findUnique({
      where: { name },
    });
    if (existingByName) {
      periods.push(existingByName);
      continue;
    }

    const overlap = await prisma.fiscalPeriod.findFirst({
      where: { startDate: { lte: endDate }, endDate: { gte: startDate } },
    });
    if (overlap) {
      const hasSameDates =
        overlap.startDate.getTime() === startDate.getTime() &&
        overlap.endDate.getTime() === endDate.getTime();
      if (hasSameDates) periods.push(overlap);
      else {
        console.warn(
          `⚠️ Skipping ${name}: its dates overlap fiscal period "${overlap.name}"`,
        );
      }
      continue;
    }

    periods.push(
      await prisma.fiscalPeriod.create({ data: { name, startDate, endDate } }),
    );
  }

  const accounts = await prisma.account.findMany({
    where: { code: { in: accountSeeds.map(({ code }) => code) } },
    orderBy: { code: 'asc' },
  });
  console.log(
    `✅ Seeded ${accounts.length} accounting accounts and ${periods.length} fiscal periods`,
  );
  console.log(
    'ℹ️ Tax rates and cash/bank accounts are left for company-specific setup.',
  );
  return { accounts, periods };
}
