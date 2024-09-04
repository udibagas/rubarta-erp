import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const admin = {
  name: 'Bagas Udi Sahsangka',
  email: 'udibagas@gmail.com',
  password: bcrypt.hashSync('bismillah', 10),
  roles: [Role.ADMIN],
};

const companies = [
  { code: 'RPA', name: 'PT Rubarta Prima Abadi' },
  { code: 'RLI', name: 'PT Rubarta Logistics Indonesia' },
];

const departments = [
  { code: 'HR', name: 'Human Resource' },
  { code: 'OPS', name: 'Operations' },
  { code: 'FA', name: 'Finance and Accounting' },
  { code: 'SM', name: 'Sales and Marketing' },
  { code: 'IT', name: 'Information Technology' },
  { code: 'LGL', name: 'Legal' },
  { code: 'PROC', name: 'Procurement' },
];

const banks = [
  { code: 'DNM', name: 'Bank Danamon' },
  { code: 'BCA', name: 'Bank Central Asia' },
  { code: 'MANDIRI', name: 'Bank Mandiri Indonesia' },
  { code: 'BNI', name: 'Bank Nasional Indonesia' },
  { code: 'BSI', name: 'Bank Syariah Indonesia' },
];

// const expenseTypes = [
//   { name: 'Rent' },
//   { name: 'Utilities' },
//   { name: 'Office Supplies' },
//   { name: 'Maintenance and Repairs' },
//   { name: 'Marketing and Advertising' },
//   { name: 'Raw Materials' },
//   { name: 'Travel and Entertainment' },
//   { name: 'Licenses and Permits' },
//   { name: 'Subscriptions and Memberships' },
//   { name: 'Fuel' },
//   { name: 'Toll' },
//   { name: 'Others' },
// ];

prisma.user
  .create({ data: admin })
  .then((r) => console.log(r))
  .catch((err) => console.error(err));

prisma.company
  .createMany({ data: companies })
  .then((r) => console.log(r))
  .catch((err) => console.error(err));

prisma.department
  .createMany({ data: departments })
  .then((r) => console.log(r))
  .catch((err) => console.error(err));

// prisma.expenseType
//   .createMany({ data: expenseTypes })
//   .then((r) => console.log(r))
//   .catch((err) => console.error(err));

prisma.bank
  .createMany({ data: banks })
  .then((r) => console.log(r))
  .catch((err) => console.error(err));
