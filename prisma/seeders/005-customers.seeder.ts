import { PrismaClient } from '../../src/prisma/client/client';

export async function seedCustomers(prisma: PrismaClient) {
  console.log('\n👥 Creating customers...');

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'PT Astra International',
        address: 'Jl. Gaya Motor Raya No.8, Jakarta Timur 13220',
        phone: '+622129501234',
        email: 'procurement@astra.co.id',
        website: 'https://www.astra.co.id',
        industry: 'Automotive',
        employeeCount: 15000,
        revenue: 500000000000,
        tags: ['automotive', 'manufacturing', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'PT Telkom Indonesia',
        address: 'Jl. Japati No. 1, Bandung 40133',
        phone: '+622120555000',
        email: 'corporate@telkom.co.id',
        website: 'https://www.telkom.co.id',
        industry: 'Telecommunications',
        employeeCount: 25000,
        revenue: 150000000000,
        tags: ['telco', 'technology', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'CV Sejahtera Bersama',
        address: 'Jl. Raya Bogor Km 25, Depok 16454',
        phone: '+622187654321',
        email: 'info@sejahtera.co.id',
        website: 'https://www.sejahtera.co.id',
        industry: 'Manufacturing',
        employeeCount: 150,
        revenue: 5000000000,
        tags: ['manufacturing', 'sme'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'PT Indofood Sukses Makmur',
        address: 'Sudirman Plaza, Indofood Tower, Jakarta Selatan 12920',
        phone: '+622125538888',
        email: 'contact@indofood.co.id',
        website: 'https://www.indofood.com',
        industry: 'Food & Beverage',
        employeeCount: 70000,
        revenue: 750000000000,
        tags: ['fmcg', 'food', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'PT Bank Central Asia',
        address: 'Menara BCA, Grand Indonesia, Jakarta Pusat 10310',
        phone: '+622123588000',
        email: 'corporate@bca.co.id',
        website: 'https://www.bca.co.id',
        industry: 'Banking',
        employeeCount: 27000,
        revenue: 300000000000,
        tags: ['finance', 'banking', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'CV Karya Mandiri',
        address: 'Jl. Raya Serpong No. 45, Tangerang Selatan 15310',
        phone: '+622153162888',
        email: 'admin@karyamandiri.co.id',
        industry: 'Construction',
        employeeCount: 85,
        revenue: 3500000000,
        tags: ['construction', 'sme'],
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);
  return customers;
}
