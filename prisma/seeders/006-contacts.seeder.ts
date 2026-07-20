import { PrismaClient } from '../../src/prisma/client/client';

export async function seedContacts(
  prisma: PrismaClient,
  data: { customers: any[] },
) {
  console.log('\n📞 Creating contacts...');

  const { customers } = data;

  const contacts = await Promise.all([
    // PT Astra International
    prisma.contact.create({
      data: {
        customerId: customers[0].id,
        name: 'Budi Santoso',
        email: 'budi.santoso@astra.co.id',
        phone: '+6281234567890',
        position: 'Procurement Manager',
        isPrimary: true,
        isActive: true,
      },
    }),
    prisma.contact.create({
      data: {
        customerId: customers[0].id,
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@astra.co.id',
        phone: '+6281234567891',
        position: 'Purchasing Officer',
        isPrimary: false,
        isActive: true,
      },
    }),
    // PT Telkom Indonesia
    prisma.contact.create({
      data: {
        customerId: customers[1].id,
        name: 'Ahmad Yani',
        email: 'ahmad.yani@telkom.co.id',
        phone: '+6281345678901',
        position: 'IT Infrastructure Head',
        isPrimary: true,
        isActive: true,
      },
    }),
    // CV Sejahtera Bersama
    prisma.contact.create({
      data: {
        customerId: customers[2].id,
        name: 'Dewi Lestari',
        email: 'dewi@sejahtera.co.id',
        phone: '+6281456789012',
        position: 'Owner',
        isPrimary: true,
        isActive: true,
      },
    }),
    // PT Indofood
    prisma.contact.create({
      data: {
        customerId: customers[3].id,
        name: 'Rizki Pratama',
        email: 'rizki.pratama@indofood.co.id',
        phone: '+6281567890123',
        position: 'Supply Chain Director',
        isPrimary: true,
        isActive: true,
      },
    }),
    prisma.contact.create({
      data: {
        customerId: customers[3].id,
        name: 'Linda Wijaya',
        email: 'linda.wijaya@indofood.co.id',
        phone: '+6281567890124',
        position: 'Procurement Specialist',
        isPrimary: false,
        isActive: true,
      },
    }),
    // PT BCA
    prisma.contact.create({
      data: {
        customerId: customers[4].id,
        name: 'Hendra Gunawan',
        email: 'hendra.gunawan@bca.co.id',
        phone: '+6281678901234',
        position: 'Operations Manager',
        isPrimary: true,
        isActive: true,
      },
    }),
    // CV Karya Mandiri
    prisma.contact.create({
      data: {
        customerId: customers[5].id,
        name: 'Andi Wijaya',
        email: 'andi@karyamandiri.co.id',
        phone: '+6281789012345',
        position: 'Managing Director',
        isPrimary: true,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${contacts.length} contacts`);
  return contacts;
}
