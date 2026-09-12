# Database Seeders

This directory contains modular database seeders that can be run individually or all together.

## Running All Seeders

To run all seeders in the correct order:

```bash
npm run seed
```

This will seed all data in the following order:

1. Users
2. Companies
3. Departments
4. Banks
5. Suppliers
6. Materials
7. Customers
8. Contacts
9. Leads
10. Opportunities
11. Quotations
12. Tasks
13. Interactions
14. Orders
15. Visit Plans

## Running Individual Seeders

To run a specific seeder:

```bash
npm run seed:one <seeder-name>
```

### Available Seeders

- **users** - Create admin and sales users
- **companies** - Create companies (RPA, RLI)
- **departments** - Create departments (HR, OPS, FA, etc.)
- **banks** - Create banks (BCA, Mandiri, etc.)
- **suppliers** - Create suppliers (requires banks)
- **materials** - Create materials/products (requires suppliers)
- **customers** - Create customers
- **contacts** - Create customer contacts (requires customers)
- **leads** - Create sales leads (requires customers, companies, users)
- **opportunities** - Create opportunities (requires customers, companies, users)
- **quotations** - Create quotations (requires customers, users, opportunities, materials)
- **tasks** - Create tasks (requires users, opportunities, leads)
- **interactions** - Create interactions (requires users, opportunities, leads)
- **orders** - Create orders (requires customers, materials)
- **visitPlans** - Create visit plans (requires customers, contacts, users, companies)

### Examples

```bash
# Seed only users
npm run seed:one users

# Seed only customers
npm run seed:one customers

# Seed only visit plans
npm run seed:one visitPlans

# List all available seeders
npm run seed:one
```

## Seeder Dependencies

Some seeders depend on data from other seeders. The dependencies are:

```
users (no dependencies)
companies (no dependencies)
departments (no dependencies)
banks (no dependencies)
  ↓
suppliers → banks
  ↓
materials → suppliers
customers (no dependencies)
  ↓
contacts → customers
  ↓
leads → customers, companies, users
opportunities → customers, companies, users
  ↓
quotations → customers, users, opportunities, materials
tasks → users, opportunities, leads
interactions → users, opportunities, leads
orders → customers, materials
visitPlans → customers, contacts, users, companies
```

**Note**: When running individual seeders, make sure the required dependencies have been seeded first.

## Creating a New Seeder

1. Create a new file in `prisma/seeders/` with the naming pattern `<model>.seeder.ts`
2. Export a function that takes `prisma` and any required data dependencies:

```typescript
import { PrismaClient } from '../../src/prisma/client/client';

export async function seedMyModel(
  prisma: PrismaClient,
  data: {
    /* dependencies */
  },
) {
  console.log('\n📦 Creating my model...');

  // Your seeding logic here

  console.log('✅ Created my model data');
  return result;
}
```

3. Export the seeder in `prisma/seeders/index.ts`
4. Add the seeder to `run-seeder.ts` in the SEEDERS object and switch statement
5. Add the seeder call to the main `prisma/seed.ts` file

## File Structure

```
prisma/
├── seed.ts                    # Main seed file (runs all seeders)
├── seeders/
│   ├── index.ts              # Exports all seeders
│   ├── run-seeder.ts         # CLI tool for running individual seeders
│   ├── users.seeder.ts       # User seeder
│   ├── companies.seeder.ts   # Company seeder
│   ├── departments.seeder.ts # Department seeder
│   ├── banks.seeder.ts       # Bank seeder
│   ├── suppliers.seeder.ts   # Supplier seeder
│   ├── materials.seeder.ts   # Material seeder
│   ├── customers.seeder.ts   # Customer seeder
│   ├── contacts.seeder.ts    # Contact seeder
│   ├── leads.seeder.ts       # Lead seeder
│   ├── opportunities.seeder.ts # Opportunity seeder
│   ├── quotations.seeder.ts  # Quotation seeder
│   ├── tasks.seeder.ts       # Task seeder
│   ├── interactions.seeder.ts # Interaction seeder
│   ├── orders.seeder.ts      # Order seeder
│   └── visit-plan.seeder.ts  # Visit Plan seeder
```
