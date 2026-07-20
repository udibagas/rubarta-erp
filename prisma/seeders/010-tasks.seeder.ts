import {
  PrismaClient,
  TaskStatus,
  TaskPriority,
} from '../../src/prisma/client/client';

export async function seedTasks(
  prisma: PrismaClient,
  data: { users: any[]; opportunities: any[]; leads: any[] },
) {
  console.log('\n✅ Creating tasks...');

  const { users, opportunities, leads } = data;
  const [admin, salesUser] = users;

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: salesUser.id,
        opportunityId: opportunities[0].id,
        title: 'Follow up on Astra quotation',
        description: 'Call Budi Santoso to discuss quotation feedback',
        dueDate: new Date('2026-05-28'),
        status: TaskStatus.InProgress,
        priority: TaskPriority.High,
      },
    }),
    prisma.task.create({
      data: {
        userId: salesUser.id,
        opportunityId: opportunities[1].id,
        title: 'Prepare technical presentation for Telkom',
        description:
          'Create slides about electronics components specifications',
        dueDate: new Date('2026-05-30'),
        status: TaskStatus.Todo,
        priority: TaskPriority.Medium,
      },
    }),
    prisma.task.create({
      data: {
        userId: admin.id,
        opportunityId: opportunities[2].id,
        title: 'Process Indofood PO',
        description: 'Convert accepted quotation to purchase order',
        dueDate: new Date('2026-05-25'),
        status: TaskStatus.Completed,
        priority: TaskPriority.Urgent,
        completedAt: new Date('2026-05-25'),
      },
    }),
    prisma.task.create({
      data: {
        userId: salesUser.id,
        leadId: leads[2].id,
        title: 'Schedule site visit to Sejahtera Bersama',
        description: 'Arrange meeting to understand their requirements',
        dueDate: new Date('2026-06-05'),
        status: TaskStatus.Todo,
        priority: TaskPriority.Medium,
      },
    }),
    prisma.task.create({
      data: {
        userId: admin.id,
        opportunityId: opportunities[3].id,
        title: 'Prepare proposal for BCA maintenance contract',
        description: 'Draft comprehensive proposal for quarterly supply',
        dueDate: new Date('2026-06-10'),
        status: TaskStatus.Todo,
        priority: TaskPriority.High,
      },
    }),
    prisma.task.create({
      data: {
        userId: salesUser.id,
        leadId: leads[0].id,
        title: 'Update Astra in CRM system',
        description: 'Add new contact person and update company information',
        dueDate: new Date('2026-05-20'),
        status: TaskStatus.Completed,
        priority: TaskPriority.Low,
        completedAt: new Date('2026-05-18'),
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);
  return tasks;
}
