import { PrismaClient } from '../../src/prisma/client/client';

export async function seedBanks(prisma: PrismaClient) {
  console.log('\n🏦 Creating banks...');

  const banksData = [
    { code: 'DNM', name: 'Bank Danamon' },
    { code: 'BCA', name: 'Bank Central Asia' },
    { code: 'MANDIRI', name: 'Bank Mandiri Indonesia' },
    { code: 'BNI', name: 'Bank Nasional Indonesia' },
    { code: 'BSI', name: 'Bank Syariah Indonesia' },
  ];

  const banks = [];
  for (const bank of banksData) {
    const b = await prisma.bank.upsert({
      where: { code: bank.code },
      update: {},
      create: bank,
    });
    banks.push(b);
  }

  console.log(`✅ Created ${banks.length} banks`);
  return banks;
}
