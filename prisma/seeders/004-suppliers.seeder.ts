import { PrismaClient, Currency } from '../../src/prisma/client/client';

export async function seedSuppliers(
  prisma: PrismaClient,
  data: { banks: any[] },
) {
  console.log('\n🏭 Creating suppliers...');

  const { banks } = data;

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        code: 'SUP001',
        name: 'PT Maju Jaya Sentosa',
        address: 'Jl. Industri No. 123, Jakarta Utara',
        phone: '+62215551234',
        email: 'info@majujaya.co.id',
        bankId: banks[0].id,
        bankAccount: '1234567890',
        currency: Currency.IDR,
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP002',
        name: 'CV Berkah Logistik',
        address: 'Jl. Raya Bekasi Km 18, Bekasi',
        phone: '+62218887766',
        email: 'contact@berkahlogistik.co.id',
        bankId: banks[1].id,
        bankAccount: '9876543210',
        currency: Currency.IDR,
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP003',
        name: 'PT Global Parts International',
        address: 'Jl. Gatot Subroto Kav. 88, Jakarta Selatan',
        phone: '+62213334455',
        email: 'sales@globalparts.com',
        bankId: banks[2].id,
        bankAccount: '5544332211',
        currency: Currency.USD,
      },
    }),
  ]);

  console.log(`✅ Created ${suppliers.length} suppliers`);
  return suppliers;
}
