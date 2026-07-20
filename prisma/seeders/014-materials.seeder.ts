import { PrismaClient } from '../../src/prisma/client/client';

export async function seedMaterials(
  prisma: PrismaClient,
  data: { suppliers: any[] },
) {
  console.log('\n🔧 Creating materials...');

  const { suppliers } = data;

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
  return materials;
}
