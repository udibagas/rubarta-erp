#!/usr/bin/env ts-node
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/prisma/client/client';
import * as seeders from './index';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: `${process.env.DATABASE_URL}`,
  }),
});

const SEEDERS = {
  users: seeders.seedUsers,
  companies: seeders.seedCompanies,
  departments: seeders.seedDepartments,
  banks: seeders.seedBanks,
  suppliers: seeders.seedSuppliers,
  materials: seeders.seedMaterials,
  customers: seeders.seedCustomers,
  contacts: seeders.seedContacts,
  leads: seeders.seedLeads,
  opportunities: seeders.seedOpportunities,
  quotations: seeders.seedQuotations,
  tasks: seeders.seedTasks,
  interactions: seeders.seedInteractions,
  orders: seeders.seedOrders,
  visitPlans: seeders.seedVisitPlans,
};

async function runSeeder(name: string) {
  console.log(`\n🌱 Running ${name} seeder...\n`);

  try {
    let result;

    switch (name) {
      case 'users':
        result = await seeders.seedUsers(prisma);
        break;

      case 'companies':
        result = await seeders.seedCompanies(prisma);
        break;

      case 'departments':
        result = await seeders.seedDepartments(prisma);
        break;

      case 'banks':
        result = await seeders.seedBanks(prisma);
        break;

      case 'suppliers': {
        const banks = await prisma.bank.findMany();
        result = await seeders.seedSuppliers(prisma, { banks });
        break;
      }

      case 'materials': {
        const suppliers = await prisma.supplier.findMany();
        result = await seeders.seedMaterials(prisma, { suppliers });
        break;
      }

      case 'customers':
        result = await seeders.seedCustomers(prisma);
        break;

      case 'contacts': {
        const customers = await prisma.customer.findMany();
        result = await seeders.seedContacts(prisma, { customers });
        break;
      }

      case 'leads': {
        const customers = await prisma.customer.findMany();
        const companies = await prisma.company.findMany();
        const users = await prisma.user.findMany();
        result = await seeders.seedLeads(prisma, {
          customers,
          companies,
          users,
        });
        break;
      }

      case 'opportunities': {
        const customers = await prisma.customer.findMany();
        const companies = await prisma.company.findMany();
        const users = await prisma.user.findMany();
        result = await seeders.seedOpportunities(prisma, {
          customers,
          companies,
          users,
        });
        break;
      }

      case 'quotations': {
        const customers = await prisma.customer.findMany();
        const users = await prisma.user.findMany();
        const opportunities = await prisma.opportunity.findMany();
        const materials = await prisma.material.findMany();
        result = await seeders.seedQuotations(prisma, {
          customers,
          users,
          opportunities,
          materials,
        });
        break;
      }

      case 'tasks': {
        const users = await prisma.user.findMany();
        const opportunities = await prisma.opportunity.findMany();
        const leads = await prisma.lead.findMany();
        result = await seeders.seedTasks(prisma, {
          users,
          opportunities,
          leads,
        });
        break;
      }

      case 'interactions': {
        const users = await prisma.user.findMany();
        const opportunities = await prisma.opportunity.findMany();
        const leads = await prisma.lead.findMany();
        result = await seeders.seedInteractions(prisma, {
          users,
          opportunities,
          leads,
        });
        break;
      }

      case 'orders': {
        const customers = await prisma.customer.findMany();
        const materials = await prisma.material.findMany();
        result = await seeders.seedOrders(prisma, { customers, materials });
        break;
      }

      case 'visitPlans': {
        const customers = await prisma.customer.findMany();
        const contacts = await prisma.contact.findMany();
        const users = await prisma.user.findMany();
        const companies = await prisma.company.findMany();
        result = await seeders.seedVisitPlans(prisma, {
          customers,
          contacts,
          users,
          companies,
        });
        break;
      }

      default:
        throw new Error(`Unknown seeder: ${name}`);
    }

    console.log(`\n✅ ${name} seeder completed successfully!`);
    return result;
  } catch (error) {
    console.error(`\n❌ Error running ${name} seeder:`);
    throw error;
  }
}

async function main() {
  const seederName = process.argv[2];

  if (!seederName) {
    console.log('📋 Available seeders:');
    Object.keys(SEEDERS).forEach((name) => {
      console.log(`   - ${name}`);
    });
    console.log('\n💡 Usage: npm run seed:one <seeder-name>');
    console.log('   Example: npm run seed:one customers');
    process.exit(0);
  }

  if (!SEEDERS[seederName as keyof typeof SEEDERS]) {
    console.error(`❌ Unknown seeder: ${seederName}`);
    console.log('\n📋 Available seeders:');
    Object.keys(SEEDERS).forEach((name) => {
      console.log(`   - ${name}`);
    });
    process.exit(1);
  }

  await runSeeder(seederName);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
