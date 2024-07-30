import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const admin = {
  name: 'Bagas Udi Sahsangka',
  email: 'udibagas@gmail.com',
  password: bcrypt.hashSync('bismillah', 10),
  roles: [Role.ADMIN],
};

prisma.user.upsert({
  where: { email: admin.email },
  update: {},
  create: admin,
});
