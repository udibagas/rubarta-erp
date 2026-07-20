import {
  PrismaClient,
  LeadStatus,
  LeadSource,
} from '../../src/prisma/client/client';

export async function seedLeads(
  prisma: PrismaClient,
  data: { customers: any[]; companies: any[]; users: any[] },
) {
  console.log('\n🎯 Creating leads...');

  const { customers, companies, users } = data;
  const [admin, salesUser] = users;

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        title: 'Pneumatic Systems Upgrade Project',
        customerId: customers[0].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        source: LeadSource.Referral,
        status: LeadStatus.Converted,
        estimatedValue: 150000000,
        notes:
          'Referred by existing customer. Interested in pneumatic systems.',
        convertedDate: new Date('2026-04-15'),
      },
    }),
    prisma.lead.create({
      data: {
        title: 'Industrial Electronics Supply',
        customerId: customers[1].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        source: LeadSource.Website,
        status: LeadStatus.Qualified,
        estimatedValue: 75000000,
        notes:
          'Submitted inquiry form on website. Need industrial electronics.',
      },
    }),
    prisma.lead.create({
      data: {
        title: 'Mechanical Parts Inquiry',
        customerId: customers[2].id,
        companyId: companies[0].id,
        userId: admin.id,
        source: LeadSource.ColdCall,
        status: LeadStatus.Contacted,
        estimatedValue: 25000000,
        notes: 'Cold called. Showed interest in mechanical parts.',
      },
    }),
    prisma.lead.create({
      data: {
        title: 'Manufacturing Expo 2026 - Annual Supply Contract',
        customerId: customers[3].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        source: LeadSource.Event,
        status: LeadStatus.Converted,
        estimatedValue: 200000000,
        notes: 'Met at Manufacturing Expo 2026. Large order potential.',
        convertedDate: new Date('2026-05-01'),
      },
    }),
    prisma.lead.create({
      data: {
        title: 'Construction Parts Referral',
        customerId: customers[5].id,
        companyId: companies[0].id,
        userId: admin.id,
        source: LeadSource.Referral,
        status: LeadStatus.New,
        estimatedValue: 15000000,
        notes: 'New lead from existing network. Initial contact pending.',
      },
    }),
  ]);

  console.log(`✅ Created ${leads.length} leads`);
  return leads;
}
