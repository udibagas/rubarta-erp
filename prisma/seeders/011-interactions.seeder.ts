import { PrismaClient, InteractionType } from '../../src/prisma/client/client';

export async function seedInteractions(
  prisma: PrismaClient,
  data: { users: any[]; opportunities: any[]; leads: any[] },
) {
  console.log('\n💬 Creating interactions...');

  const { users, opportunities, leads } = data;
  const [admin, salesUser] = users;

  const interactions = await Promise.all([
    prisma.interaction.create({
      data: {
        opportunityId: opportunities[0].id,
        userId: salesUser.id,
        type: InteractionType.Meeting,
        date: new Date('2026-05-15'),
        duration: 90,
        subject: 'Initial Meeting - Pneumatic System Requirements',
        notes:
          'Met with Budi Santoso and his team. Discussed current system and upgrade needs. They are interested in a complete overhaul.',
        outcome: 'Positive. Will send quotation by end of week.',
      },
    }),
    prisma.interaction.create({
      data: {
        opportunityId: opportunities[0].id,
        userId: salesUser.id,
        type: InteractionType.Call,
        date: new Date('2026-05-22'),
        duration: 30,
        subject: 'Follow up on quotation QUO-2026-001',
        notes:
          'Called Budi to confirm receipt of quotation. He is reviewing with his team.',
        outcome: 'Waiting for feedback by next week.',
      },
    }),
    prisma.interaction.create({
      data: {
        leadId: leads[1].id,
        userId: salesUser.id,
        type: InteractionType.Email,
        date: new Date('2026-05-18'),
        duration: null,
        subject: 'Technical specifications inquiry',
        notes:
          'Ahmad Yani requested detailed specs for electronics components.',
        outcome: 'Sent product catalog and specifications.',
      },
    }),
    prisma.interaction.create({
      data: {
        opportunityId: opportunities[2].id,
        userId: salesUser.id,
        type: InteractionType.Demo,
        date: new Date('2026-04-25'),
        duration: 120,
        subject: 'Product demonstration at Indofood facility',
        notes:
          'Demonstrated pneumatic systems and mechanical parts quality. Showed samples and discussed specifications.',
        outcome:
          'Very positive. Requested formal quotation for annual contract.',
      },
    }),
    prisma.interaction.create({
      data: {
        opportunityId: opportunities[2].id,
        userId: admin.id,
        type: InteractionType.Call,
        date: new Date('2026-05-20'),
        duration: 15,
        subject: 'Quotation acceptance confirmation',
        notes: 'Rizki Pratama confirmed acceptance of QUO-2026-003.',
        outcome: 'Quotation accepted. Will receive PO within 3 days.',
      },
    }),
    prisma.interaction.create({
      data: {
        leadId: leads[2].id,
        userId: admin.id,
        type: InteractionType.Call,
        date: new Date('2026-05-12'),
        duration: 20,
        subject: 'Cold call - Introduction',
        notes:
          'Introduced Rubarta and our product range. Dewi showed interest.',
        outcome: 'Will schedule site visit next month.',
      },
    }),
    prisma.interaction.create({
      data: {
        opportunityId: opportunities[3].id,
        userId: admin.id,
        type: InteractionType.Meeting,
        date: new Date('2026-05-08'),
        duration: 60,
        subject: 'Discuss facility maintenance requirements',
        notes:
          'Met with Hendra at BCA head office. Discussed their nationwide maintenance needs.',
        outcome: 'Requested proposal for quarterly supply contract.',
      },
    }),
    prisma.interaction.create({
      data: {
        leadId: leads[4].id,
        userId: admin.id,
        type: InteractionType.SiteVisit,
        date: new Date('2026-05-10'),
        duration: 45,
        subject: 'Site visit to construction projects',
        notes:
          'Visited their construction site. Assessed mechanical parts needs.',
        outcome: 'Will send sample products and price list.',
      },
    }),
  ]);

  console.log(`✅ Created ${interactions.length} interactions`);
  return interactions;
}
