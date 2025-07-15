import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  console.log('🧹 Cleaning up existing data...')
  // Delete relations first to avoid foreign key constraint errors
  await prisma.quoteItem.deleteMany();
  await prisma.productPricing.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.material.deleteMany();
  await prisma.hardware.deleteMany();
  await prisma.taxSettings.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.doorType.deleteMany();
  await prisma.doorModel.deleteMany();
  await prisma.colorTone.deleteMany();
  await prisma.woodGrain.deleteMany();
  await prisma.handle.deleteMany();
  await prisma.deliveryAddress.deleteMany();
  await prisma.billingAddress.deleteMany();
  await prisma.user.deleteMany({ where: { email: { not: 'admin@cocinaslujo.mx' } } }); // Keep admin
  console.log('✅ Cleanup complete.');


  // Create admin user
  const adminPassword = await hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cocinaslujo.mx' },
    update: {
        password: adminPassword
    },
    create: {
      name: 'Administrador',
      email: 'admin@cocinaslujo.mx',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      companyName: 'Cocinas de Lujo México',
      phone: '+52 55 1234 5678',
      country: 'Mexico',
      deliveryAddress: {
        create: {
          street: 'Av. Presidente Masaryk',
          exteriorNumber: '111',
          colony: 'Polanco',
          zipCode: '11560',
          city: 'Ciudad de México',
          state: 'CDMX',
        },
      },
      billingAddress: {
        create: {
          street: 'Av. Presidente Masaryk',
          number: '111',
          colony: 'Polanco',
          zipCode: '11560',
          city: 'Ciudad de México',
          state: 'CDMX',
        },
      },
    },
  });

  // Create demo users
  const demoPassword = await hash('demo123', 12)
  const dealer = await prisma.user.upsert({
    where: { email: 'dealer@ejemplo.mx' },
    update: {},
    create: {
      name: 'Juan Pérez',
      email: 'dealer@ejemplo.mx',
      password: demoPassword,
      role: 'DEALER',
      status: 'ACTIVE',
      companyName: 'Distribuidora Cocinas',
      taxId: 'DCO123456789',
      phone: '+52 55 9876 5432',
      discountRate: 15,
      deliveryAddress: {
        create: {
          street: 'Calle Falsa',
          exteriorNumber: '123',
          colony: 'Centro',
          zipCode: '06000',
          city: 'Ciudad de México',
          state: 'CDMX',
        },
      },
    },
  });

  const retail = await prisma.user.upsert({
    where: { email: 'cliente@ejemplo.mx' },
    update: {},
    create: {
      name: 'María González',
      email: 'cliente@ejemplo.mx',
      password: demoPassword,
      role: 'RETAIL',
      status: 'ACTIVE',
      phone: '+52 55 5555 1234',
      deliveryAddress: {
        create: {
          street: 'Av. Siempre Viva',
          exteriorNumber: '742',
          colony: 'Springfield',
          zipCode: '00000',
          city: 'Ciudad de México',
          state: 'CDMX',
        },
      },
    },
  });

  // Create company settings
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'Cocinas de Lujo México',
      address: 'Av. Presidente Masaryk 111', // This field is still in CompanySettings
      city: 'Ciudad de México',
      state: 'CDMX',
      zipCode: '11560',
      phone: '+52 55 1234 5678',
      email: 'contacto@cocinaslujo.mx',
      website: 'https://cocinaslujo.mx',
      taxId: 'CLM123456789',
    },
  });

  // Create tax settings
  await prisma.taxSettings.upsert({
    where: { id: 'iva-mexico' },
    update: {},
    create: {
      id: 'iva-mexico',
      name: 'IVA México',
      rate: 16,
      isDefault: true,
      description: 'Impuesto al Valor Agregado en México',
    },
  })

  // Create categories
  const categories = [
    {
      id: 'gabinetes-base',
      name: 'Gabinetes Base',
      description: 'Gabinetes inferiores para cocina',
      image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
    },
    {
      id: 'gabinetes-altos',
      name: 'Gabinetes Altos',
      description: 'Gabinetes superiores de pared',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400',
    },
    {
      id: 'islas',
      name: 'Islas de Cocina',
      description: 'Islas centrales multifuncionales',
      image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400',
    },
    {
      id: 'pantry',
      name: 'Alacenas y Pantry',
      description: 'Almacenamiento vertical',
      image: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=400',
    },
    {
      id: 'accesorios',
      name: 'Accesorios',
      description: 'Herrajes y complementos',
      image: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=400',
    },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {},
      create: category,
    })
  }

  // Create materials
  const materials = [
    {
      id: 'madera-roble',
      name: 'Roble Europeo',
      description: 'Madera noble de roble con veta natural',
      color: '#D2691E',
      finish: 'Natural',
      texture: 'Veta natural',
      costPerUnit: 850,
      unit: 'm2',
    },
    {
      id: 'laminado-blanco',
      name: 'Laminado Blanco Mate',
      description: 'Superficie laminada resistente',
      color: '#FFFFFF',
      finish: 'Mate',
      texture: 'Lisa',
      costPerUnit: 320,
      unit: 'm2',
    },
    {
      id: 'lacado-negro',
      name: 'Lacado Negro Brillante',
      description: 'Acabado lacado de alto brillo',
      color: '#000000',
      finish: 'Brillante',
      texture: 'Lisa',
      costPerUnit: 950,
      unit: 'm2',
    },
  ]

  for (const material of materials) {
    await prisma.material.upsert({
      where: { id: material.id },
      update: {},
      create: material,
    })
  }

  // Create hardware
  const hardware = [
    {
      id: 'bisagra-blum',
      name: 'Bisagra Blum Soft Close',
      description: 'Bisagra de cierre suave premium',
      type: 'hinge',
      brand: 'Blum',
      model: 'CLIP Top',
      costPerUnit: 85,
      unit: 'piece',
    },
    {
      id: 'corredera-hettich',
      name: 'Corredera Hettich Full Extension',
      description: 'Corredera de extensión completa',
      type: 'drawer_slide',
      brand: 'Hettich',
      model: 'InnoTech Atira',
      costPerUnit: 120,
      unit: 'pair',
    },
    {
      id: 'tirador-moderno',
      name: 'Tirador Moderno Acero',
      description: 'Tirador minimalista de acero inoxidable',
      type: 'handle',
      brand: 'Häfele',
      model: 'Modern Line',
      costPerUnit: 45,
      unit: 'piece',
    },
  ]

  for (const hw of hardware) {
    await prisma.hardware.upsert({
      where: { id: hw.id },
      update: {},
      create: hw,
    })
  }

  // Create door types
  const doorTypes = [
    { id: 'melamina', name: 'Melamina' },
    { id: 'vidrio-aluminio', name: 'Vidrio y Marcos de Aluminio' },
    { id: 'alto-brillo', name: 'Alto Brillo' },
  ];

  for (const type of doorTypes) {
    await prisma.doorType.upsert({
      where: { id: type.id },
      update: {},
      create: type,
    });
  }

  // Create door models
  const doorModels = [
    { id: 'con-moldura', name: 'Con Moldura' },
    { id: 'liso', name: 'Liso' },
  ];

  for (const model of doorModels) {
    await prisma.doorModel.upsert({
      where: { id: model.id },
      update: {},
      create: model,
    });
  }

  // Create color tones
  const colorTones = [
    { id: 'roble-cenizo', name: 'Roble Cenizo', hexCode: '#A0522D' },
    { id: 'blanco-polar', name: 'Blanco Polar', hexCode: '#F8F8F8' },
    { id: 'gris-urbano', name: 'Gris Urbano', hexCode: '#808080' },
  ];

  for (const tone of colorTones) {
    await prisma.colorTone.upsert({
      where: { id: tone.id },
      update: {},
      create: tone,
    });
  }

  // Create wood grains
  const woodGrains = [
    { id: 'veta-vertical', name: 'Veta Vertical', direction: 'Vertical' },
    { id: 'veta-horizontal', name: 'Veta Horizontal', direction: 'Horizontal' },
  ];

  for (const grain of woodGrains) {
    await prisma.woodGrain.upsert({
      where: { id: grain.id },
      update: {},
      create: grain,
    });
  }

  // Create handles
  const handles = [
    { id: 'barra-30cm', name: 'Barra 30cm', cost: 150 },
    { id: 'embutida-moderna', name: 'Embutida Moderna', cost: 200 },
  ];

  for (const handle of handles) {
    await prisma.handle.upsert({
      where: { id: handle.id },
      update: {},
      create: handle,
    });
  }

  // Create products with pricing
  const products = [
    // Base Cabinets
    {
      name: 'Gabinete Base 60cm',
      description: 'Gabinete inferior de 60cm con una puerta y estante ajustable',
      sku: 'GB-60-001',
      categoryId: 'gabinetes-base',
      width: 60,
      height: 85,
      depth: 60,
      weight: 35,
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300',
      isCustomizable: true,
      leadTime: 14,
      doorTypeId: 'melamina',
      doorModelId: 'liso',
      colorToneId: 'blanco-polar',
      woodGrainId: 'veta-vertical',
      basePrices: {
        VIP: 6400,
        DEALER: 5950,
        ADMIN: 5500,
      },
    },
    {
      name: 'Gabinete Base 80cm',
      description: 'Gabinete inferior de 80cm con dos puertas y estante',
      sku: 'GB-80-002',
      categoryId: 'gabinetes-base',
      width: 80,
      height: 85,
      depth: 60,
      weight: 42,
      images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300',
      isCustomizable: true,
      leadTime: 14,
      doorTypeId: 'melamina',
      doorModelId: 'liso',
      colorToneId: 'roble-cenizo',
      woodGrainId: 'veta-horizontal',
      basePrices: {
        VIP: 8400,
        DEALER: 7840,
        ADMIN: 7200,
      },
    },
    {
      name: 'Gabinete Base Esquinero',
      description: 'Gabinete esquinero con sistema giratorio interno',
      sku: 'GB-ESQ-003',
      categoryId: 'gabinetes-base',
      width: 90,
      height: 85,
      depth: 90,
      weight: 55,
      images: ['https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=300',
      isCustomizable: true,
      leadTime: 21,
      doorTypeId: 'alto-brillo',
      doorModelId: 'con-moldura',
      colorToneId: 'gris-urbano',
      woodGrainId: 'veta-vertical',
      basePrices: {
        VIP: 13875,
        DEALER: 12950,
        ADMIN: 11900,
      },
    },

    // Wall Cabinets
    {
      name: 'Gabinete Alto 60cm',
      description: 'Gabinete de pared de 60cm con una puerta',
      sku: 'GA-60-004',
      categoryId: 'gabinetes-altos',
      width: 60,
      height: 70,
      depth: 35,
      weight: 22,
      images: ['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300',
      isCustomizable: true,
      leadTime: 10,
      basePrices: {
        VIP: 4650,
        DEALER: 4340,
        ADMIN: 3990,
      },
    },
    {
      name: 'Gabinete Alto 80cm Doble',
      description: 'Gabinete de pared de 80cm con dos puertas',
      sku: 'GA-80-005',
      categoryId: 'gabinetes-altos',
      width: 80,
      height: 70,
      depth: 35,
      weight: 28,
      images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=300',
      isCustomizable: true,
      leadTime: 10,
      basePrices: {
        VIP: 5850,
        DEALER: 5460,
        ADMIN: 5020,
      },
    },

    // Kitchen Islands
    {
      name: 'Isla Central Premium',
      description: 'Isla de cocina con barra para desayuno y almacenamiento',
      sku: 'IC-PREM-006',
      categoryId: 'islas',
      width: 200,
      height: 90,
      depth: 100,
      weight: 120,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300',
      isCustomizable: true,
      leadTime: 28,
      basePrices: {
        VIP: 33750,
        DEALER: 31500,
        ADMIN: 28950,
      },
    },
    {
      name: 'Isla Compacta',
      description: 'Isla pequeña ideal para cocinas medianas',
      sku: 'IC-COMP-007',
      categoryId: 'islas',
      width: 140,
      height: 90,
      depth: 80,
      weight: 85,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=300',
      isCustomizable: true,
      leadTime: 21,
      basePrices: {
        VIP: 21375,
        DEALER: 19950,
        ADMIN: 18335,
      },
    },

    // Pantry
    {
      name: 'Alacena Torre',
      description: 'Torre de almacenamiento de suelo a techo',
      sku: 'AT-TORRE-008',
      categoryId: 'pantry',
      width: 60,
      height: 240,
      depth: 60,
      weight: 85,
      images: ['https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300',
      isCustomizable: true,
      leadTime: 18,
      basePrices: {
        VIP: 16500,
        DEALER: 15400,
        ADMIN: 14150,
      },
    },

    // Accessories
    {
      name: 'Set Organizadores Cajón',
      description: 'Set completo de organizadores para cajones',
      sku: 'ACC-ORG-009',
      categoryId: 'accesorios',
      width: 50,
      height: 8,
      depth: 45,
      weight: 2,
      images: ['https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=300',
      isCustomizable: false,
      leadTime: 5,
      basePrices: {
        VIP: 900,
        DEALER: 840,
        ADMIN: 772,
      },
    },
    {
      name: 'Sistema Iluminación LED',
      description: 'Kit de iluminación LED bajo gabinetes',
      sku: 'ACC-LED-010',
      categoryId: 'accesorios',
      width: 100,
      height: 2,
      depth: 2,
      weight: 1.5,
      images: ['https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=600'],
      thumbnail: 'https://images.unsplash.com/photo-1556912173-46c336c7fd55?w=300',
      isCustomizable: false,
      leadTime: 7,
      basePrices: {
        VIP: 2625,
        DEALER: 2450,
        ADMIN: 2252,
      },
    },
  ]

  for (let i = 0; i < products.length; i++) {
    const product = products[i]
    
    const createdProduct = await prisma.product.create({
      data: {
        name: product.name,
        description: product.description,
        sku: product.sku,
        categoryId: product.categoryId,
        width: product.width,
        height: product.height,
        depth: product.depth,
        weight: product.weight,
        images: product.images,
        thumbnail: product.thumbnail,
        isCustomizable: product.isCustomizable,
        leadTime: product.leadTime,
        doorTypeId: product.doorTypeId,
        doorModelId: product.doorModelId,
        colorToneId: product.colorToneId,
        woodGrainId: product.woodGrainId,
      },
    });

    // Create pricing for all user roles
    for (const [role, price] of Object.entries(product.basePrices)) {
      await prisma.productPricing.create({
        data: {
          productId: createdProduct.id,
          userRole: role as any,
          basePrice: price,
          markup: 0,
          finalPrice: price,
        },
      })
    }

    console.log(`✅ Created product: ${product.name}`)
  }

  // Create some sample quotes
  const sampleQuote = await prisma.quote.create({
    data: {
      quoteNumber: 'COT-20250620-001',
      userId: retail.id,
      customerName: 'María González',
      customerEmail: 'cliente@ejemplo.mx',
      customerPhone: '+52 55 5555 1234',
      projectName: 'Cocina Principal Casa Polanco',
      projectAddress: 'Av. Polanco 123, CDMX',
      roomDimensions: {
        width: 4.5,
        height: 2.4,
        depth: 3.2,
      },
      subtotal: 35000,
      taxAmount: 5600,
      totalAmount: 40600,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: 'DRAFT', // Changed from PENDING to DRAFT
    },
  })

  // Add items to the sample quote with custom dimensions
  const products_list = await prisma.product.findMany({ take: 3 })
  for (const product of products_list) {
    const pricing = await prisma.productPricing.findFirst({
      where: { productId: product.id, userRole: 'RETAIL' },
    })
    
    if (pricing) {
      const quantity = Math.floor(Math.random() * 3) + 1
      
      // Generate realistic custom dimensions (varying from standard by ±20%)
      const productWidth = product.width || 600 // default width if null
      const productHeight = product.height || 600 // default height if null
      const customWidth = Math.round(productWidth * (0.8 + Math.random() * 0.4))
      const customHeight = Math.round(productHeight * (0.8 + Math.random() * 0.4))
      
      // Calculate area-based pricing for customizable products
      let unitPrice = pricing.finalPrice
      if (product.isCustomizable && productWidth && productHeight) {
        const standardArea = (productWidth / 1000) * (productHeight / 1000)
        const customArea = (customWidth / 1000) * (customHeight / 1000)
        const pricePerSquareMeter = pricing.finalPrice / standardArea
        unitPrice = customArea * pricePerSquareMeter
      }
      
      await prisma.quoteItem.create({
        data: {
          quoteId: sampleQuote.id,
          productId: product.id,
          quantity: quantity,
          customWidth: customWidth,
          customHeight: customHeight,
          customDepth: product.depth, // Keep standard depth
          unitPrice: unitPrice,
          totalPrice: unitPrice * quantity,
        },
      })
    }
  }

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`👤 Users created: 3 (admin, dealer, retail)`);
  console.log(`🏢 Company settings: 1`);
  console.log(`💰 Tax settings: 1`);
  console.log(`📂 Categories: ${categories.length}`);
  console.log(`🧱 Materials: ${materials.length}`);
  console.log(`🔧 Hardware: ${hardware.length}`);
  console.log(`🚪 Door Types: ${doorTypes.length}`);
  console.log(`🚪 Door Models: ${doorModels.length}`);
  console.log(`🎨 Color Tones: ${colorTones.length}`);
  console.log(`🌳 Wood Grains: ${woodGrains.length}`);
  console.log(`✋ Handles: ${handles.length}`);
  console.log(`📦 Products: ${products.length}`);
  console.log(`📋 Sample quotes: 1`);
  console.log('\n🔑 Demo credentials:');
  console.log('Admin: admin@cocinaslujo.mx / admin123');
  console.log('Dealer: dealer@ejemplo.mx / demo123');
  console.log('Retail: cliente@ejemplo.mx / demo123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
