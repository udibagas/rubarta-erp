import { PrismaClient } from '../../src/prisma/client/client';

export async function seedDepartments(prisma: PrismaClient) {
  console.log('\n🏬 Creating departments...');

  const departmentsData = [
    { code: 'HR', name: 'Human Resource' },
    { code: 'OPS', name: 'Operations' },
    { code: 'FA', name: 'Finance and Accounting' },
    { code: 'SM', name: 'Sales and Marketing' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'LGL', name: 'Legal' },
    { code: 'PROC', name: 'Procurement' },
  ];

  const departments = [];
  for (const dept of departmentsData) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    departments.push(department);
  }

  console.log(`✅ Created ${departments.length} departments`);
  return departments;
}
