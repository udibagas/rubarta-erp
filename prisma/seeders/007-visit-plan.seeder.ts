import { PrismaClient, VisitPlanStatus } from '../../src/prisma/client/client';

export async function seedVisitPlans(
  prisma: PrismaClient,
  data: {
    customers: any[];
    contacts: any[];
    users: any[];
    companies: any[];
  },
) {
  console.log('\n📅 Creating visit plans...');

  const { customers, contacts, users, companies } = data;

  const visitPlans = await Promise.all([
    // Visit to first customer - Planned
    prisma.visitPlan.create({
      data: {
        customerId: customers[0].id,
        userId: users[1].id, // Sales user
        companyId: companies[0].id,
        contactId: contacts[0]?.id,
        title: 'Initial Product Presentation',
        purpose:
          'Present new product catalog and discuss partnership opportunities',
        scheduledDate: new Date('2026-07-10'),
        scheduledTime: '10:00',
        estimatedDuration: 90,
        status: VisitPlanStatus.Planned,
        address: customers[0].address,
        contactPerson: contacts[0]?.name || 'Contact Person',
        contactPhone: contacts[0]?.phone || customers[0].phone,
        notes: 'Bring product samples and latest catalog',
      },
    }),

    // Visit to second customer - In Progress
    prisma.visitPlan.create({
      data: {
        customerId: customers[1].id,
        userId: users[1].id,
        companyId: companies[0].id,
        contactId: contacts[1]?.id,
        title: 'Follow-up Meeting on Quotation',
        purpose: 'Discuss quotation details and negotiate terms',
        scheduledDate: new Date('2026-07-05'),
        scheduledTime: '14:00',
        estimatedDuration: 60,
        status: VisitPlanStatus.InProgress,
        address: customers[1].address,
        contactPerson: contacts[1]?.name || 'Contact Person',
        contactPhone: contacts[1]?.phone || customers[1].phone,
        notes: 'Review pricing and delivery schedule',
      },
    }),

    // Visit to third customer - Completed
    prisma.visitPlan.create({
      data: {
        customerId: customers[2].id,
        userId: users[1].id,
        companyId: companies[0].id,
        contactId: contacts[2]?.id,
        title: 'Site Survey and Assessment',
        purpose: 'Conduct site survey for equipment installation',
        scheduledDate: new Date('2026-06-20'),
        scheduledTime: '09:00',
        estimatedDuration: 120,
        status: VisitPlanStatus.Completed,
        actualVisitDate: new Date('2026-06-20T09:15:00'),
        outcome:
          'Successfully completed site survey. Identified optimal equipment placement locations. Customer expressed satisfaction with our assessment.',
        address: customers[2].address,
        contactPerson: contacts[2]?.name || 'Contact Person',
        contactPhone: contacts[2]?.phone || customers[2].phone,
        notes: 'Bring measuring tools and camera for documentation',
      },
    }),

    // Visit to fourth customer - Rescheduled
    prisma.visitPlan.create({
      data: {
        customerId: customers[3].id,
        userId: users[0].id, // Admin user
        companyId: companies[1].id,
        contactId: contacts[3]?.id,
        title: 'Product Training Session',
        purpose: 'Provide training on newly delivered equipment',
        scheduledDate: new Date('2026-07-15'),
        scheduledTime: '13:00',
        estimatedDuration: 180,
        status: VisitPlanStatus.Rescheduled,
        address: customers[3].address,
        contactPerson: contacts[3]?.name || 'Contact Person',
        contactPhone: contacts[3]?.phone || customers[3].phone,
        notes:
          'Originally scheduled for July 8. Rescheduled at customer request.',
      },
    }),

    // Visit to fifth customer - Cancelled
    prisma.visitPlan.create({
      data: {
        customerId: customers[4].id,
        userId: users[1].id,
        companyId: companies[0].id,
        contactId: contacts[4]?.id,
        title: 'Maintenance Check Visit',
        purpose: 'Routine maintenance and system check',
        scheduledDate: new Date('2026-06-28'),
        scheduledTime: '11:00',
        estimatedDuration: 90,
        status: VisitPlanStatus.Cancelled,
        address: customers[4].address,
        contactPerson: contacts[4]?.name || 'Contact Person',
        contactPhone: contacts[4]?.phone || customers[4].phone,
        notes: 'Cancelled due to customer vacation schedule',
      },
    }),

    // Additional planned visit - using fallback contact info
    prisma.visitPlan.create({
      data: {
        customerId: customers[0].id,
        userId: users[1].id,
        companyId: companies[0].id,
        // No contactId - using fallback fields
        title: 'Annual Contract Review',
        purpose: 'Review annual contract terms and discuss renewal',
        scheduledDate: new Date('2026-08-01'),
        scheduledTime: '15:30',
        estimatedDuration: 60,
        status: VisitPlanStatus.Planned,
        address: customers[0].address,
        contactPerson: 'Finance Manager',
        contactPhone: '+62214445566',
        notes: 'Prepare contract renewal documents',
      },
    }),

    // Visit for demo
    prisma.visitPlan.create({
      data: {
        customerId: customers[5].id,
        userId: users[1].id,
        companyId: companies[1].id,
        contactId: contacts.find((c) => c.customerId === customers[5].id)?.id,
        title: 'Live Product Demonstration',
        purpose: 'Demonstrate new automation system capabilities',
        scheduledDate: new Date('2026-07-20'),
        scheduledTime: '10:30',
        estimatedDuration: 150,
        status: VisitPlanStatus.Planned,
        address: customers[5].address,
        contactPerson: 'Operations Director',
        contactPhone: customers[5].phone,
        notes: 'Bring laptop, projector, and demo equipment',
      },
    }),
  ]);

  console.log(`✅ Created ${visitPlans.length} visit plans`);

  return visitPlans;
}
