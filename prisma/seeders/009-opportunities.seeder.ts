import {
  PrismaClient,
  OpportunityStages,
} from '../../src/prisma/client/client';

export async function seedOpportunities(
  prisma: PrismaClient,
  data: { customers: any[]; companies: any[]; users: any[] },
) {
  console.log('\n💼 Creating opportunities...');

  const { customers, companies, users } = data;
  const [admin, salesUser] = users;

  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        customerId: customers[0].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        name: 'Pneumatic System Upgrade - PT Astra',
        description:
          'Complete pneumatic system upgrade for production line. Includes cylinders, valves, and regulators.',
        amount: 150000000,
        probability: 80,
        stage: OpportunityStages.Negotiation,
        expectedCloseDate: new Date('2026-06-30'),
      },
    }),
    prisma.opportunity.create({
      data: {
        customerId: customers[1].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        name: 'Electronics Components - Telkom',
        description:
          'Bulk order of electronics components for network equipment maintenance.',
        amount: 75000000,
        probability: 60,
        stage: OpportunityStages.Proposal,
        expectedCloseDate: new Date('2026-07-15'),
      },
    }),
    prisma.opportunity.create({
      data: {
        customerId: customers[3].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        name: 'Industrial Parts Supply - Indofood',
        description:
          'Annual supply contract for mechanical and pneumatic parts.',
        amount: 200000000,
        probability: 90,
        stage: OpportunityStages.Proposal_Sent,
        expectedCloseDate: new Date('2026-06-15'),
      },
    }),
    prisma.opportunity.create({
      data: {
        customerId: customers[4].id,
        companyId: companies[0].id,
        userId: admin.id,
        name: 'Facility Maintenance Parts - BCA',
        description:
          'Quarterly supply of maintenance parts for all branch offices.',
        amount: 120000000,
        probability: 70,
        stage: OpportunityStages.Qualification,
        expectedCloseDate: new Date('2026-08-01'),
      },
    }),
  ]);

  console.log(`✅ Created ${opportunities.length} opportunities`);
  return opportunities;
}
