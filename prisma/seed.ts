import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/prisma/client/client';
import * as seeders from './seeders/index';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: `${process.env.DATABASE_URL}`,
  }),
});

async function main() {
  console.log('🌱 Starting seed...\n');

  // Run all seeders in order
  const users = await seeders.seedUsers(prisma);
  const companies = await seeders.seedCompanies(prisma);
  const departments = await seeders.seedDepartments(prisma);
  const banks = await seeders.seedBanks(prisma);
  const suppliers = await seeders.seedSuppliers(prisma, { banks });
  const materials = await seeders.seedMaterials(prisma, { suppliers });
  const customers = await seeders.seedCustomers(prisma);
  const contacts = await seeders.seedContacts(prisma, { customers });
  const leads = await seeders.seedLeads(prisma, {
    customers,
    companies,
    users,
  });
  const opportunities = await seeders.seedOpportunities(prisma, {
    customers,
    companies,
    users,
  });
  const quotations = await seeders.seedQuotations(prisma, {
    customers,
    users,
    opportunities,
    materials,
  });
  const tasks = await seeders.seedTasks(prisma, {
    users,
    opportunities,
    leads,
  });
  const interactions = await seeders.seedInteractions(prisma, {
    users,
    opportunities,
    leads,
  });
  const orders = await seeders.seedOrders(prisma, { customers, materials });
  const visitPlans = await seeders.seedVisitPlans(prisma, {
    customers,
    contacts,
    users,
    companies,
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Companies: ${companies.length}`);
  console.log(`   - Departments: ${departments.length}`);
  console.log(`   - Banks: ${banks.length}`);
  console.log(`   - Suppliers: ${suppliers.length}`);
  console.log(`   - Materials: ${materials.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Contacts: ${contacts.length}`);
  console.log(`   - Leads: ${leads.length}`);
  console.log(`   - Opportunities: ${opportunities.length}`);
  console.log(`   - Quotations: ${quotations.length}`);
  console.log(`   - Tasks: ${tasks.length}`);
  console.log(`   - Interactions: ${interactions.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Visit Plans: ${visitPlans.length}`);
  console.log('='.repeat(70));
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
