const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const admin = {
  name: 'Bagas Udi Sahsangka',
  email: 'udibagas@gmail.com',
  password: bcrypt.hashSync('rahasia123', 10),
  roles: ['ADMIN'],
};

const user = {
  name: 'User',
  email: 'user@mail.com',
  password: bcrypt.hashSync('user123', 10),
  roles: ['USER'],
};

prisma.user
  .deleteMany()
  .then(() => {
    console.log('Users table truncated');
    return prisma.user.create({
      data: admin,
    });
  })
  .then((res) => {
    console.log('Admin user created', res);
    return prisma.user.create({
      data: user,
    });
  })
  .then((data) => {
    console.log('User created', data);
  })
  .catch((e) => console.log(e));
