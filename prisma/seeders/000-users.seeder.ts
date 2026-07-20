import { PrismaClient, Role } from '../../src/prisma/client/client';
import * as bcrypt from 'bcrypt';

export async function seedUsers(prisma: PrismaClient) {
  console.log('\n👤 Creating users...');

  const admin = await prisma.user.upsert({
    where: { email: 'udibagas@gmail.com' },
    update: {},
    create: {
      name: 'Bagas Udi Sahsangka',
      email: 'udibagas@gmail.com',
      password: bcrypt.hashSync('bismillah', 10),
      roles: [Role.ADMIN],
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { email: 'sales@rubarta.com' },
    update: {},
    create: {
      name: 'Sales Manager',
      email: 'sales@rubarta.com',
      password: bcrypt.hashSync('sales123', 10),
      roles: [Role.USER],
    },
  });

  console.log('✅ Created users');
  return [admin, salesUser];
}
