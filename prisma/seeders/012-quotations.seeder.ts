import {
  PrismaClient,
  QuotationStatus,
  Currency,
} from '../../src/prisma/client/client';

export async function seedQuotations(
  prisma: PrismaClient,
  data: {
    customers: any[];
    users: any[];
    opportunities: any[];
    materials: any[];
  },
) {
  console.log('\n📄 Creating quotations...');

  const { customers, users, opportunities, materials } = data;
  const salesUser = users[1];

  const quotation1 = await prisma.quotation.create({
    data: {
      number: 'QUO-2026-001',
      title: 'Quotation - Pneumatic System PT Astra',
      description: 'Quotation for pneumatic system components',
      customerId: customers[0].id,
      userId: salesUser.id,
      opportunityId: opportunities[0].id,
      totalAmount: 135000000,
      discount: 5000000,
      vatAmount: 14300000,
      grandTotal: 144300000,
      status: QuotationStatus.Sent,
      currency: Currency.IDR,
      validity: 30,
      validUntil: new Date('2026-06-25'),
      sentDate: new Date('2026-05-26'),
      termsAndConditions:
        'Payment: 30 days after delivery\nDelivery: 14 days after PO',
      QuotationItems: {
        create: [
          {
            partNumber: materials[6].partNumber,
            name: materials[6].name,
            model: materials[6].model,
            description: materials[6].description || materials[6].name,
            quantity: 10,
            unitPrice: 750000,
            discount: 0,
            totalPrice: 7500000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[7].partNumber,
            name: materials[7].name,
            model: materials[7].model,
            description: materials[7].description || materials[7].name,
            quantity: 15,
            unitPrice: 600000,
            discount: 0,
            totalPrice: 9000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[8].partNumber,
            name: materials[8].name,
            model: materials[8].model,
            description: materials[8].description || materials[8].name,
            quantity: 20,
            unitPrice: 450000,
            discount: 0,
            totalPrice: 9000000,
            vat: true,
            sortOrder: 3,
          },
          {
            partNumber: materials[4].partNumber,
            name: materials[4].name,
            model: materials[4].model,
            description: materials[4].description || materials[4].name,
            quantity: 100,
            unitPrice: 120000,
            discount: 500000,
            totalPrice: 11500000,
            vat: true,
            sortOrder: 4,
          },
        ],
      },
    },
  });

  const quotation2 = await prisma.quotation.create({
    data: {
      number: 'QUO-2026-002',
      title: 'Quotation - Electronics Parts Telkom',
      description: 'Bulk electronics components for network equipment',
      customerId: customers[1].id,
      userId: salesUser.id,
      opportunityId: opportunities[1].id,
      totalAmount: 68000000,
      discount: 2000000,
      vatAmount: 7260000,
      grandTotal: 73260000,
      status: QuotationStatus.Draft,
      currency: Currency.IDR,
      validity: 30,
      validUntil: new Date('2026-07-25'),
      termsAndConditions:
        'Payment: 45 days after delivery\nDelivery: 21 days after PO',
      QuotationItems: {
        create: [
          {
            partNumber: materials[0].partNumber,
            name: materials[0].name,
            model: materials[0].model,
            description: materials[0].description || materials[0].name,
            quantity: 1000,
            unitPrice: 5000,
            discount: 0,
            totalPrice: 5000000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[1].partNumber,
            name: materials[1].name,
            model: materials[1].model,
            description: materials[1].description || materials[1].name,
            quantity: 2000,
            unitPrice: 1000,
            discount: 0,
            totalPrice: 2000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[2].partNumber,
            name: materials[2].name,
            model: materials[2].model,
            description: materials[2].description || materials[2].name,
            quantity: 1500,
            unitPrice: 2500,
            discount: 0,
            totalPrice: 3750000,
            vat: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  const quotation3 = await prisma.quotation.create({
    data: {
      number: 'QUO-2026-003',
      title: 'Quotation - Annual Supply Contract Indofood',
      description: 'Annual supply of industrial parts',
      customerId: customers[3].id,
      userId: salesUser.id,
      opportunityId: opportunities[2].id,
      totalAmount: 180000000,
      discount: 10000000,
      vatAmount: 18700000,
      grandTotal: 188700000,
      status: QuotationStatus.Accepted,
      currency: Currency.IDR,
      validity: 45,
      validUntil: new Date('2026-07-15'),
      sentDate: new Date('2026-05-10'),
      acceptedDate: new Date('2026-05-20'),
      termsAndConditions:
        'Payment: 30 days after monthly delivery\nDelivery: Monthly basis',
      QuotationItems: {
        create: [
          {
            partNumber: materials[3].partNumber,
            name: materials[3].name,
            model: materials[3].model,
            description: materials[3].description || materials[3].name,
            quantity: 200,
            unitPrice: 45000,
            discount: 1000000,
            totalPrice: 8000000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[4].partNumber,
            name: materials[4].name,
            model: materials[4].model,
            description: materials[4].description || materials[4].name,
            quantity: 150,
            unitPrice: 120000,
            discount: 2000000,
            totalPrice: 16000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[9].partNumber,
            name: materials[9].name,
            model: materials[9].model,
            description: materials[9].description || materials[9].name,
            quantity: 50,
            unitPrice: 1200000,
            discount: 3000000,
            totalPrice: 57000000,
            vat: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  console.log('✅ Created 3 quotations with items');
  return [quotation1, quotation2, quotation3];
}
