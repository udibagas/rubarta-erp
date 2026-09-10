import {
  Customer,
  PrismaClient,
  SalesOrderStatus,
} from '../../src/prisma/client/client';

export async function seedOrders(
  prisma: PrismaClient,
  data: { customers: Customer[]; materials: any[] },
) {
  console.log('\n📦 Creating orders...');

  const { customers, materials } = data;

  // const order1 = await prisma.salesOrder.create({
  //   data: {
  //     number: 'ORD-2026-001',
  //     date: new Date('2026-05-22'),
  //     customerId: customers[3].id as number,
  //     description: 'Order from accepted quotation QUO-2026-003',
  //     totalAmount: 180000000,
  //     discount: 10000000,
  //     vatAmount: 18700000,
  //     grandTotal: 188700000,
  //     status: SalesOrderStatus.Processing,
  //     shippingAddress: 'Sudirman Plaza, Indofood Tower, Jakarta Selatan 12920',
  //     billingAddress: 'Sudirman Plaza, Indofood Tower, Jakarta Selatan 12920',
  //     paymentTerms: '30 days after monthly delivery',
  //     deliveryDate: new Date('2026-06-15'),
  //     notes: 'First delivery of annual contract. Monthly recurring.',
  //     SalesOrderItems: {
  //       create: [
  //         {
  //           partNumber: materials[3].partNumber,
  //           description: materials[3].description || materials[3].name,
  //           quantity: 200,
  //           unitPrice: 45000,
  //           totalPrice: 8000000,
  //           sortOrder: 1,
  //         },
  //         {
  //           partNumber: materials[4].partNumber,
  //           description: materials[4].description || materials[4].name,
  //           quantity: 150,
  //           unitPrice: 120000,
  //           totalPrice: 16000000,
  //           sortOrder: 2,
  //         },
  //         {
  //           partNumber: materials[9].partNumber,
  //           description: materials[9].description || materials[9].name,
  //           quantity: 50,
  //           unitPrice: 1200000,
  //           totalPrice: 57000000,
  //           sortOrder: 3,
  //         },
  //       ],
  //     },
  //   },
  // });

  // const order2 = await prisma.salesOrder.create({
  //   data: {
  //     number: 'ORD-2026-002',
  //     date: new Date('2026-04-20'),
  //     customerId: customers[0].id as number,
  //     description: 'Sample order for testing',
  //     totalAmount: 25000000,
  //     discount: 1000000,
  //     vatAmount: 2640000,
  //     grandTotal: 26640000,
  //     status: SalesOrderStatus.Completed,
  //     shippingAddress: 'Jl. Gaya Motor Raya No.8, Jakarta Timur 13220',
  //     billingAddress: 'Jl. Gaya Motor Raya No.8, Jakarta Timur 13220',
  //     paymentTerms: 'Net 30',
  //     deliveryDate: new Date('2026-05-05'),
  //     notes:
  //       'Sample order completed successfully. Customer satisfied with quality.',
  //     SalesOrderItems: {
  //       create: [
  //         {
  //           partNumber: materials[7].partNumber,
  //           description: materials[7].description || materials[7].name,
  //           quantity: 5,
  //           unitPrice: 600000,
  //           totalPrice: 3000000,
  //           sortOrder: 1,
  //         },
  //         {
  //           partNumber: materials[8].partNumber,
  //           description: materials[8].description || materials[8].name,
  //           quantity: 8,
  //           unitPrice: 450000,
  //           totalPrice: 3600000,
  //           sortOrder: 2,
  //         },
  //         {
  //           partNumber: materials[4].partNumber,
  //           description: materials[4].description || materials[4].name,
  //           quantity: 20,
  //           unitPrice: 120000,
  //           totalPrice: 2400000,
  //           sortOrder: 3,
  //         },
  //       ],
  //     },
  //   },
  // });

  console.log('✅ Created 2 orders with items');
  // return [order1, order2];
}
