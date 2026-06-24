import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Role,
  LeadStatus,
  LeadSource,
  OpportunityStages,
  QuotationStatus,
  TaskStatus,
  TaskPriority,
  InteractionType,
  OrderStatus,
  Currency,
} from '../src/prisma/client/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: `${process.env.DATABASE_URL}`,
  }),
});

async function main() {
  console.log('🌱 Starting seed...\n');

  // ============================================================================
  // BASIC DATA
  // ============================================================================

  console.log('📦 Creating basic data...');

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
  console.log('✅ Admin user created');

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
  console.log('✅ Sales user created');

  const companies = await Promise.all([
    prisma.company.upsert({
      where: { code: 'RPA' },
      update: {},
      create: { code: 'RPA', name: 'PT Rubarta Prima Abadi' },
    }),
    prisma.company.upsert({
      where: { code: 'RLI' },
      update: {},
      create: { code: 'RLI', name: 'PT Rubarta Logistics Indonesia' },
    }),
  ]);
  console.log('✅ Companies created');

  const departmentsData = [
    { code: 'HR', name: 'Human Resource' },
    { code: 'OPS', name: 'Operations' },
    { code: 'FA', name: 'Finance and Accounting' },
    { code: 'SM', name: 'Sales and Marketing' },
    { code: 'IT', name: 'Information Technology' },
    { code: 'LGL', name: 'Legal' },
    { code: 'PROC', name: 'Procurement' },
  ];

  for (const dept of departmentsData) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
  }
  console.log('✅ Departments created');

  const banksData = [
    { code: 'DNM', name: 'Bank Danamon' },
    { code: 'BCA', name: 'Bank Central Asia' },
    { code: 'MANDIRI', name: 'Bank Mandiri Indonesia' },
    { code: 'BNI', name: 'Bank Nasional Indonesia' },
    { code: 'BSI', name: 'Bank Syariah Indonesia' },
  ];

  const banks = [];
  for (const bank of banksData) {
    const b = await prisma.bank.upsert({
      where: { code: bank.code },
      update: {},
      create: bank,
    });
    banks.push(b);
  }
  console.log('✅ Banks created');

  // ============================================================================
  // SUPPLIERS
  // ============================================================================

  console.log('\n🏭 Creating suppliers...');

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        code: 'SUP001',
        name: 'PT Maju Jaya Sentosa',
        address: 'Jl. Industri No. 123, Jakarta Utara',
        phone: '+62215551234',
        email: 'info@majujaya.co.id',
        bankId: banks[0].id,
        bankAccount: '1234567890',
        currency: Currency.IDR,
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP002',
        name: 'CV Berkah Logistik',
        address: 'Jl. Raya Bekasi Km 18, Bekasi',
        phone: '+62218887766',
        email: 'contact@berkahlogistik.co.id',
        bankId: banks[1].id,
        bankAccount: '9876543210',
        currency: Currency.IDR,
      },
    }),
    prisma.supplier.create({
      data: {
        code: 'SUP003',
        name: 'PT Global Parts International',
        address: 'Jl. Gatot Subroto Kav. 88, Jakarta Selatan',
        phone: '+62213334455',
        email: 'sales@globalparts.com',
        bankId: banks[2].id,
        bankAccount: '5544332211',
        currency: Currency.USD,
      },
    }),
  ]);
  console.log(`✅ Created ${suppliers.length} suppliers`);

  // ============================================================================
  // MATERIALS
  // ============================================================================

  console.log('\n🔧 Creating materials...');

  const materials = await Promise.all([
    // Electronics parts
    prisma.material.create({
      data: {
        partNumber: 'ELC-001',
        name: 'Capacitor 100uF',
        description: 'Electrolytic capacitor 100 microfarad 25V',
        category: 'Electronics',
        unit: 'pcs',
        purchasePrice: 2500,
        sellingPrice: 5000,
        minStock: 100,
        currentStock: 250,
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    prisma.material.create({
      data: {
        partNumber: 'ELC-002',
        name: 'Resistor 10K Ohm',
        description: '10K ohm 1/4W carbon film resistor',
        category: 'Electronics',
        unit: 'pcs',
        purchasePrice: 500,
        sellingPrice: 1000,
        minStock: 500,
        currentStock: 350, // Low stock!
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    prisma.material.create({
      data: {
        partNumber: 'ELC-003',
        name: 'LED 5mm Red',
        description: '5mm red LED light emitting diode',
        category: 'Electronics',
        unit: 'pcs',
        purchasePrice: 1000,
        sellingPrice: 2500,
        minStock: 200,
        currentStock: 800,
        supplierId: suppliers[0].id,
        isActive: true,
      },
    }),
    // Mechanical parts
    prisma.material.create({
      data: {
        partNumber: 'MCH-001',
        name: 'Bearing 6205',
        description: 'Deep groove ball bearing 6205 size',
        category: 'Mechanical',
        unit: 'pcs',
        purchasePrice: 25000,
        sellingPrice: 45000,
        minStock: 50,
        currentStock: 30, // Low stock!
        supplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    prisma.material.create({
      data: {
        partNumber: 'MCH-002',
        name: 'V-Belt A50',
        description: 'V-belt type A length 50 inches',
        category: 'Mechanical',
        unit: 'pcs',
        purchasePrice: 75000,
        sellingPrice: 120000,
        minStock: 20,
        currentStock: 45,
        supplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    prisma.material.create({
      data: {
        partNumber: 'MCH-003',
        name: 'Hex Bolt M10x50',
        description: 'Hexagonal bolt M10 x 50mm with nut',
        category: 'Mechanical',
        unit: 'pcs',
        purchasePrice: 3000,
        sellingPrice: 6000,
        minStock: 100,
        currentStock: 500,
        supplierId: suppliers[1].id,
        isActive: true,
      },
    }),
    // Pneumatic parts
    prisma.material.create({
      data: {
        partNumber: 'PNU-001',
        name: 'Air Cylinder 50mm',
        description: 'Pneumatic air cylinder bore 50mm stroke 100mm',
        category: 'Pneumatic',
        unit: 'pcs',
        purchasePrice: 450000,
        sellingPrice: 750000,
        minStock: 10,
        currentStock: 5, // Low stock!
        supplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    prisma.material.create({
      data: {
        partNumber: 'PNU-002',
        name: 'Solenoid Valve 5/2',
        description: '5/2 way solenoid valve 24VDC',
        category: 'Pneumatic',
        unit: 'pcs',
        purchasePrice: 350000,
        sellingPrice: 600000,
        minStock: 15,
        currentStock: 25,
        supplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    prisma.material.create({
      data: {
        partNumber: 'PNU-003',
        name: 'Air Filter Regulator',
        description: 'Air filter regulator combination 1/4 inch',
        category: 'Pneumatic',
        unit: 'pcs',
        purchasePrice: 275000,
        sellingPrice: 450000,
        minStock: 8,
        currentStock: 20,
        supplierId: suppliers[2].id,
        isActive: true,
      },
    }),
    // Raw materials
    prisma.material.create({
      data: {
        partNumber: 'RAW-001',
        name: 'Steel Plate 5mm',
        description: 'Mild steel plate thickness 5mm 4x8 feet',
        category: 'Raw Material',
        unit: 'sheet',
        purchasePrice: 850000,
        sellingPrice: 1200000,
        minStock: 20,
        currentStock: 35,
        supplierId: suppliers[1].id,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${materials.length} materials`);

  // ============================================================================
  // CUSTOMERS
  // ============================================================================

  console.log('\n👥 Creating customers...');

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'PT Astra International',
        address: 'Jl. Gaya Motor Raya No.8, Jakarta Timur 13220',
        phone: '+622129501234',
        email: 'procurement@astra.co.id',
        website: 'https://www.astra.co.id',
        industry: 'Automotive',
        employeeCount: 15000,
        revenue: 500000000000,
        tags: ['automotive', 'manufacturing', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'PT Telkom Indonesia',
        address: 'Jl. Japati No. 1, Bandung 40133',
        phone: '+622120555000',
        email: 'corporate@telkom.co.id',
        website: 'https://www.telkom.co.id',
        industry: 'Telecommunications',
        employeeCount: 25000,
        revenue: 150000000000,
        tags: ['telco', 'technology', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'CV Sejahtera Bersama',
        address: 'Jl. Raya Bogor Km 25, Depok 16454',
        phone: '+622187654321',
        email: 'info@sejahtera.co.id',
        website: 'https://www.sejahtera.co.id',
        industry: 'Manufacturing',
        employeeCount: 150,
        revenue: 5000000000,
        tags: ['manufacturing', 'sme'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'PT Indofood Sukses Makmur',
        address: 'Sudirman Plaza, Indofood Tower, Jakarta Selatan 12920',
        phone: '+622125538888',
        email: 'contact@indofood.co.id',
        website: 'https://www.indofood.com',
        industry: 'Food & Beverage',
        employeeCount: 70000,
        revenue: 750000000000,
        tags: ['fmcg', 'food', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'PT Bank Central Asia',
        address: 'Menara BCA, Grand Indonesia, Jakarta Pusat 10310',
        phone: '+622123588000',
        email: 'corporate@bca.co.id',
        website: 'https://www.bca.co.id',
        industry: 'Banking',
        employeeCount: 27000,
        revenue: 300000000000,
        tags: ['finance', 'banking', 'enterprise'],
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'CV Karya Mandiri',
        address: 'Jl. Raya Serpong No. 45, Tangerang Selatan 15310',
        phone: '+622153162888',
        email: 'admin@karyamandiri.co.id',
        industry: 'Construction',
        employeeCount: 85,
        revenue: 3500000000,
        tags: ['construction', 'sme'],
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${customers.length} customers`);

  // ============================================================================
  // CONTACTS
  // ============================================================================

  console.log('\n📞 Creating contacts...');

  const contacts = await Promise.all([
    // PT Astra International
    prisma.contact.create({
      data: {
        customerId: customers[0].id,
        name: 'Budi Santoso',
        email: 'budi.santoso@astra.co.id',
        phone: '+6281234567890',
        position: 'Procurement Manager',
        isPrimary: true,
        isActive: true,
      },
    }),
    prisma.contact.create({
      data: {
        customerId: customers[0].id,
        name: 'Siti Nurhaliza',
        email: 'siti.nurhaliza@astra.co.id',
        phone: '+6281234567891',
        position: 'Purchasing Officer',
        isPrimary: false,
        isActive: true,
      },
    }),
    // PT Telkom Indonesia
    prisma.contact.create({
      data: {
        customerId: customers[1].id,
        name: 'Ahmad Yani',
        email: 'ahmad.yani@telkom.co.id',
        phone: '+6281345678901',
        position: 'IT Infrastructure Head',
        isPrimary: true,
        isActive: true,
      },
    }),
    // CV Sejahtera Bersama
    prisma.contact.create({
      data: {
        customerId: customers[2].id,
        name: 'Dewi Lestari',
        email: 'dewi@sejahtera.co.id',
        phone: '+6281456789012',
        position: 'Owner',
        isPrimary: true,
        isActive: true,
      },
    }),
    // PT Indofood
    prisma.contact.create({
      data: {
        customerId: customers[3].id,
        name: 'Rizki Pratama',
        email: 'rizki.pratama@indofood.co.id',
        phone: '+6281567890123',
        position: 'Supply Chain Director',
        isPrimary: true,
        isActive: true,
      },
    }),
    prisma.contact.create({
      data: {
        customerId: customers[3].id,
        name: 'Linda Wijaya',
        email: 'linda.wijaya@indofood.co.id',
        phone: '+6281567890124',
        position: 'Procurement Specialist',
        isPrimary: false,
        isActive: true,
      },
    }),
    // PT BCA
    prisma.contact.create({
      data: {
        customerId: customers[4].id,
        name: 'Hendra Gunawan',
        email: 'hendra.gunawan@bca.co.id',
        phone: '+6281678901234',
        position: 'Operations Manager',
        isPrimary: true,
        isActive: true,
      },
    }),
    // CV Karya Mandiri
    prisma.contact.create({
      data: {
        customerId: customers[5].id,
        name: 'Andi Wijaya',
        email: 'andi@karyamandiri.co.id',
        phone: '+6281789012345',
        position: 'Managing Director',
        isPrimary: true,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${contacts.length} contacts`);

  // ============================================================================
  // LEADS
  // ============================================================================

  console.log('\n🎯 Creating leads...');

  const leads = await Promise.all([
    prisma.lead.create({
      data: {
        customerId: customers[0].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        source: LeadSource.Referral,
        status: LeadStatus.Converted,
        estimatedValue: 150000000,
        notes:
          'Referred by existing customer. Interested in pneumatic systems.',
        convertedDate: new Date('2026-04-15'),
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[1].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        source: LeadSource.Website,
        status: LeadStatus.Qualified,
        estimatedValue: 75000000,
        notes:
          'Submitted inquiry form on website. Need industrial electronics.',
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[2].id,
        companyId: companies[0].id,
        userId: admin.id,
        source: LeadSource.ColdCall,
        status: LeadStatus.Contacted,
        estimatedValue: 25000000,
        notes: 'Cold called. Showed interest in mechanical parts.',
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[3].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        source: LeadSource.Event,
        status: LeadStatus.Converted,
        estimatedValue: 200000000,
        notes: 'Met at Manufacturing Expo 2026. Large order potential.',
        convertedDate: new Date('2026-05-01'),
      },
    }),
    prisma.lead.create({
      data: {
        customerId: customers[5].id,
        companyId: companies[0].id,
        userId: admin.id,
        source: LeadSource.Referral,
        status: LeadStatus.New,
        estimatedValue: 15000000,
        notes: 'New lead from existing network. Initial contact pending.',
      },
    }),
  ]);
  console.log(`✅ Created ${leads.length} leads`);

  // ============================================================================
  // OPPORTUNITIES
  // ============================================================================

  console.log('\n💼 Creating opportunities...');

  const opportunities = await Promise.all([
    prisma.opportunity.create({
      data: {
        customerId: customers[0].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        name: 'Pneumatic System Upgrade - PT Astra',
        description:
          'Complete pneumatic system upgrade for production line. Includes cylinders, valves, and regulators.',
        amount: 150000000,
        probability: 80,
        stage: OpportunityStages.Negotiation,
        expectedCloseDate: new Date('2026-06-30'),
      },
    }),
    prisma.opportunity.create({
      data: {
        customerId: customers[1].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        name: 'Electronics Components - Telkom',
        description:
          'Bulk order of electronics components for network equipment maintenance.',
        amount: 75000000,
        probability: 60,
        stage: OpportunityStages.Proposal,
        expectedCloseDate: new Date('2026-07-15'),
      },
    }),
    prisma.opportunity.create({
      data: {
        customerId: customers[3].id,
        companyId: companies[0].id,
        userId: salesUser.id,
        name: 'Industrial Parts Supply - Indofood',
        description:
          'Annual supply contract for mechanical and pneumatic parts.',
        amount: 200000000,
        probability: 90,
        stage: OpportunityStages.Proposal_Sent,
        expectedCloseDate: new Date('2026-06-15'),
      },
    }),
    prisma.opportunity.create({
      data: {
        customerId: customers[4].id,
        companyId: companies[0].id,
        userId: admin.id,
        name: 'Facility Maintenance Parts - BCA',
        description:
          'Quarterly supply of maintenance parts for all branch offices.',
        amount: 120000000,
        probability: 70,
        stage: OpportunityStages.Qualification,
        expectedCloseDate: new Date('2026-08-01'),
      },
    }),
  ]);
  console.log(`✅ Created ${opportunities.length} opportunities`);

  // ============================================================================
  // QUOTATIONS
  // ============================================================================

  console.log('\n📄 Creating quotations...');

  const quotation1 = await prisma.quotation.create({
    data: {
      number: 'QUO-2026-001',
      title: 'Quotation - Pneumatic System PT Astra',
      description: 'Quotation for pneumatic system components',
      customerId: customers[0].id,
      userId: salesUser.id,
      opportunityId: opportunities[0].id,
      totalAmount: 135000000,
      discount: 5000000,
      vatAmount: 14300000, // 11% of (135000000 - 5000000)
      grandTotal: 144300000,
      status: QuotationStatus.Sent,
      currency: Currency.IDR,
      validity: 30,
      validUntil: new Date('2026-06-25'),
      sentDate: new Date('2026-05-26'),
      terms: 'Payment: 30 days after delivery\nDelivery: 14 days after PO',
      QuotationItems: {
        create: [
          {
            partNumber: materials[6].partNumber,
            description: materials[6].description || materials[6].name,
            quantity: 10,
            unitPrice: 750000,
            discount: 0,
            totalPrice: 7500000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[7].partNumber,
            description: materials[7].description || materials[7].name,
            quantity: 15,
            unitPrice: 600000,
            discount: 0,
            totalPrice: 9000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[8].partNumber,
            description: materials[8].description || materials[8].name,
            quantity: 20,
            unitPrice: 450000,
            discount: 0,
            totalPrice: 9000000,
            vat: true,
            sortOrder: 3,
          },
          {
            partNumber: materials[4].partNumber,
            description: materials[4].description || materials[4].name,
            quantity: 100,
            unitPrice: 120000,
            discount: 500000,
            totalPrice: 11500000,
            vat: true,
            sortOrder: 4,
          },
        ],
      },
    },
  });

  const quotation2 = await prisma.quotation.create({
    data: {
      number: 'QUO-2026-002',
      title: 'Quotation - Electronics Parts Telkom',
      description: 'Bulk electronics components for network equipment',
      customerId: customers[1].id,
      userId: salesUser.id,
      opportunityId: opportunities[1].id,
      totalAmount: 68000000,
      discount: 2000000,
      vatAmount: 7260000, // 11% of (68000000 - 2000000)
      grandTotal: 73260000,
      status: QuotationStatus.Draft,
      currency: Currency.IDR,
      validity: 30,
      validUntil: new Date('2026-07-25'),
      terms: 'Payment: 45 days after delivery\nDelivery: 21 days after PO',
      QuotationItems: {
        create: [
          {
            partNumber: materials[0].partNumber,
            description: materials[0].description || materials[0].name,
            quantity: 1000,
            unitPrice: 5000,
            discount: 0,
            totalPrice: 5000000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[1].partNumber,
            description: materials[1].description || materials[1].name,
            quantity: 2000,
            unitPrice: 1000,
            discount: 0,
            totalPrice: 2000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[2].partNumber,
            description: materials[2].description || materials[2].name,
            quantity: 1500,
            unitPrice: 2500,
            discount: 0,
            totalPrice: 3750000,
            vat: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  const quotation3 = await prisma.quotation.create({
    data: {
      number: 'QUO-2026-003',
      title: 'Quotation - Annual Supply Contract Indofood',
      description: 'Annual supply of industrial parts',
      customerId: customers[3].id,
      userId: salesUser.id,
      opportunityId: opportunities[2].id,
      totalAmount: 180000000,
      discount: 10000000,
      vatAmount: 18700000, // 11% of (180000000 - 10000000)
      grandTotal: 188700000,
      status: QuotationStatus.Accepted,
      currency: Currency.IDR,
      validity: 45,
      validUntil: new Date('2026-07-15'),
      sentDate: new Date('2026-05-10'),
      acceptedDate: new Date('2026-05-20'),
      terms: 'Payment: 30 days after monthly delivery\nDelivery: Monthly basis',
      QuotationItems: {
        create: [
          {
            partNumber: materials[3].partNumber,
            description: materials[3].description || materials[3].name,
            quantity: 200,
            unitPrice: 45000,
            discount: 1000000,
            totalPrice: 8000000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[4].partNumber,
            description: materials[4].description || materials[4].name,
            quantity: 150,
            unitPrice: 120000,
            discount: 2000000,
            totalPrice: 16000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[9].partNumber,
            description: materials[9].description || materials[9].name,
            quantity: 50,
            unitPrice: 1200000,
            discount: 3000000,
            totalPrice: 57000000,
            vat: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  console.log('✅ Created 3 quotations with items');

  // ============================================================================
  // TASKS
  // ============================================================================

  console.log('\n✅ Creating tasks...');

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: salesUser.id,
        customerId: customers[0].id,
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
        customerId: customers[1].id,
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
        customerId: customers[3].id,
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
        customerId: customers[2].id,
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
        customerId: customers[4].id,
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
        customerId: customers[0].id,
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

  // ============================================================================
  // INTERACTIONS
  // ============================================================================

  console.log('\n💬 Creating interactions...');

  const interactions = await Promise.all([
    prisma.interaction.create({
      data: {
        customerId: customers[0].id,
        userId: salesUser.id,
        type: InteractionType.Meeting,
        date: new Date('2026-05-15'),
        duration: 90,
        subject: 'Initial Meeting - Pneumatic System Requirements',
        notes:
          'Met with Budi Santoso and his team. Discussed current system and upgrade needs. They are interested in a complete overhaul.',
        outcome: 'Positive. Will send quotation by end of week.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[0].id,
        userId: salesUser.id,
        type: InteractionType.Call,
        date: new Date('2026-05-22'),
        duration: 30,
        subject: 'Follow up on quotation QUO-2026-001',
        notes:
          'Called Budi to confirm receipt of quotation. He is reviewing with his team.',
        outcome: 'Waiting for feedback by next week.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[1].id,
        userId: salesUser.id,
        type: InteractionType.Email,
        date: new Date('2026-05-18'),
        duration: null,
        subject: 'Technical specifications inquiry',
        notes:
          'Ahmad Yani requested detailed specs for electronics components.',
        outcome: 'Sent product catalog and specifications.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[3].id,
        userId: salesUser.id,
        type: InteractionType.Demo,
        date: new Date('2026-04-25'),
        duration: 120,
        subject: 'Product demonstration at Indofood facility',
        notes:
          'Demonstrated pneumatic systems and mechanical parts quality. Showed samples and discussed specifications.',
        outcome:
          'Very positive. Requested formal quotation for annual contract.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[3].id,
        userId: admin.id,
        type: InteractionType.Call,
        date: new Date('2026-05-20'),
        duration: 15,
        subject: 'Quotation acceptance confirmation',
        notes: 'Rizki Pratama confirmed acceptance of QUO-2026-003.',
        outcome: 'Quotation accepted. Will receive PO within 3 days.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[2].id,
        userId: admin.id,
        type: InteractionType.Call,
        date: new Date('2026-05-12'),
        duration: 20,
        subject: 'Cold call - Introduction',
        notes:
          'Introduced Rubarta and our product range. Dewi showed interest.',
        outcome: 'Will schedule site visit next month.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[4].id,
        userId: admin.id,
        type: InteractionType.Meeting,
        date: new Date('2026-05-08'),
        duration: 60,
        subject: 'Discuss facility maintenance requirements',
        notes:
          'Met with Hendra at BCA head office. Discussed their nationwide maintenance needs.',
        outcome: 'Requested proposal for quarterly supply contract.',
      },
    }),
    prisma.interaction.create({
      data: {
        customerId: customers[5].id,
        userId: admin.id,
        type: InteractionType.SiteVisit,
        date: new Date('2026-05-10'),
        duration: 45,
        subject: 'Site visit to construction projects',
        notes:
          'Visited their construction site. Assessed mechanical parts needs.',
        outcome: 'Will send sample products and price list.',
      },
    }),
  ]);
  console.log(`✅ Created ${interactions.length} interactions`);

  // ============================================================================
  // ORDERS
  // ============================================================================

  console.log('\n📦 Creating orders...');

  const order1 = await prisma.order.create({
    data: {
      number: 'ORD-2026-001',
      date: new Date('2026-05-22'),
      customerId: customers[3].id,
      description: 'Order from accepted quotation QUO-2026-003',
      totalAmount: 180000000,
      discount: 10000000,
      vatAmount: 18700000,
      grandTotal: 188700000,
      status: OrderStatus.Processing,
      shippingAddress: 'Sudirman Plaza, Indofood Tower, Jakarta Selatan 12920',
      billingAddress: 'Sudirman Plaza, Indofood Tower, Jakarta Selatan 12920',
      paymentTerms: '30 days after monthly delivery',
      deliveryDate: new Date('2026-06-15'),
      notes: 'First delivery of annual contract. Monthly recurring.',
      OrderItems: {
        create: [
          {
            partNumber: materials[3].partNumber,
            description: materials[3].description || materials[3].name,
            quantity: 200,
            unitPrice: 45000,
            discount: 1000000,
            totalPrice: 8000000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[4].partNumber,
            description: materials[4].description || materials[4].name,
            quantity: 150,
            unitPrice: 120000,
            discount: 2000000,
            totalPrice: 16000000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[9].partNumber,
            description: materials[9].description || materials[9].name,
            quantity: 50,
            unitPrice: 1200000,
            discount: 3000000,
            totalPrice: 57000000,
            vat: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  const order2 = await prisma.order.create({
    data: {
      number: 'ORD-2026-002',
      date: new Date('2026-04-20'),
      customerId: customers[0].id,
      description: 'Sample order for testing',
      totalAmount: 25000000,
      discount: 1000000,
      vatAmount: 2640000,
      grandTotal: 26640000,
      status: OrderStatus.Completed,
      shippingAddress: 'Jl. Gaya Motor Raya No.8, Jakarta Timur 13220',
      billingAddress: 'Jl. Gaya Motor Raya No.8, Jakarta Timur 13220',
      paymentTerms: 'Net 30',
      deliveryDate: new Date('2026-05-05'),
      notes:
        'Sample order completed successfully. Customer satisfied with quality.',
      OrderItems: {
        create: [
          {
            partNumber: materials[7].partNumber,
            description: materials[7].description || materials[7].name,
            quantity: 5,
            unitPrice: 600000,
            discount: 0,
            totalPrice: 3000000,
            vat: true,
            sortOrder: 1,
          },
          {
            partNumber: materials[8].partNumber,
            description: materials[8].description || materials[8].name,
            quantity: 8,
            unitPrice: 450000,
            discount: 0,
            totalPrice: 3600000,
            vat: true,
            sortOrder: 2,
          },
          {
            partNumber: materials[4].partNumber,
            description: materials[4].description || materials[4].name,
            quantity: 20,
            unitPrice: 120000,
            discount: 100000,
            totalPrice: 2300000,
            vat: true,
            sortOrder: 3,
          },
        ],
      },
    },
  });

  console.log('✅ Created 2 orders with items');

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n' + '='.repeat(70));
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!\n');
  console.log('📊 Summary:');
  console.log(`   - Users: 2 (admin + sales)`);
  console.log(`   - Companies: ${companies.length}`);
  console.log(`   - Departments: ${departmentsData.length}`);
  console.log(`   - Banks: ${banks.length}`);
  console.log(`   - Suppliers: ${suppliers.length}`);
  console.log(`   - Materials: ${materials.length} (3 with low stock)`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Contacts: ${contacts.length}`);
  console.log(`   - Leads: ${leads.length}`);
  console.log(`   - Opportunities: ${opportunities.length}`);
  console.log(`   - Quotations: 3 (with items)`);
  console.log(`   - Tasks: ${tasks.length}`);
  console.log(`   - Interactions: ${interactions.length}`);
  console.log(`   - Orders: 2 (with items)`);
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
