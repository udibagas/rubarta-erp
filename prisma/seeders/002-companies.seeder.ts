import { PrismaClient } from '../../src/prisma/client/client';

export async function seedCompanies(prisma: PrismaClient) {
  console.log('\n🏢 Creating companies...');

  const companies = await Promise.all([
    prisma.company.upsert({
      where: { code: 'RPA' },
      update: {},
      create: { code: 'RPA', name: 'PT Rubarta Prima Abadi' },
    }),
    prisma.company.upsert({
      where: { code: 'RLI' },
      update: {},
      create: { code: 'RLI', name: 'PT Rubarta Logistics Indonesia' },
    }),
  ]);

  console.log(`✅ Created ${companies.length} companies`);
  return companies;
}
