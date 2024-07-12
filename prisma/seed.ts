const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const users = {
  name: 'Admin',
  email: 'admin@mail.com',
  password: bcrypt.hashSync('Bismillah1@#$%', 10),
  role: 'ADMIN',
};

// prisma.user.deleteMany().then((_) => console.log('Users table truncated'));

prisma.user
  .create({
    data: users,
  })
  .then((data) => console.log(data))
  .catch((e) => console.log(e));
