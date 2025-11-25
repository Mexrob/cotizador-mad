import { PrismaClient, ProductStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Product data templates for different categories
const productTemplates = {
    'Puertas': [
        { name: 'Puerta Lisa Moderna', desc: 'Puerta de diseño minimalista sin molduras', width: 400, height: 700, depth: 18, price: 1200 },
        { name: 'Puerta con Moldura', desc: 'Puerta clásica con moldura perimetral', width: 400, height: 700, depth: 18, price: 1450 },
        { name: 'Puerta Shaker', desc: 'Puerta estilo shaker con marco y panel', width: 400, height: 700, depth: 18, price: 1580 },
        { name: 'Puerta con Vidrio', desc: 'Puerta con inserto de vidrio templado', width: 400, height: 700, depth: 18, price: 1850 },
        { name: 'Puerta Ranurada', desc: 'Puerta con ranuras verticales decorativas', width: 400, height: 700, depth: 18, price: 1650 },
        { name: 'Puerta Lacada', desc: 'Puerta con acabado lacado brillante', width: 400, height: 700, depth: 18, price: 1950 },
        { name: 'Puerta Rústica', desc: 'Puerta con acabado envejecido y texturizado', width: 400, height: 700, depth: 18, price: 1720 },
        { name: 'Puerta Alto Brillo', desc: 'Puerta con acabado alto brillo UV', width: 400, height: 700, depth: 18, price: 2100 },
        { name: 'Puerta Mate', desc: 'Puerta con acabado mate soft touch', width: 400, height: 700, depth: 18, price: 1880 },
        { name: 'Puerta Bicolor', desc: 'Puerta con dos tonos de color', width: 400, height: 700, depth: 18, price: 2050 }
    ],
    'Marco Aluminio': [
        { name: 'Marco Aluminio Estándar', desc: 'Marco de aluminio para puertas de vidrio', width: 700, height: 2100, depth: 30, price: 850 },
        { name: 'Marco Aluminio Anodizado', desc: 'Marco con acabado anodizado resistente', width: 700, height: 2100, depth: 30, price: 950 },
        { name: 'Marco Aluminio Negro Mate', desc: 'Marco negro mate para diseño moderno', width: 700, height: 2100, depth: 30, price: 1050 },
        { name: 'Marco Aluminio Blanco', desc: 'Marco blanco para cocinas claras', width: 700, height: 2100, depth: 30, price: 920 },
        { name: 'Marco Aluminio Champagne', desc: 'Marco color champagne elegante', width: 700, height: 2100, depth: 30, price: 980 },
        { name: 'Marco Aluminio Doble', desc: 'Marco para puertas dobles', width: 1400, height: 2100, depth: 30, price: 1650 },
        { name: 'Marco Aluminio Esquinero', desc: 'Marco especial para esquinas', width: 700, height: 2100, depth: 30, price: 1150 },
        { name: 'Marco Aluminio Premium', desc: 'Marco de alta resistencia', width: 700, height: 2100, depth: 35, price: 1280 },
        { name: 'Marco Aluminio Slim', desc: 'Marco delgado minimalista', width: 700, height: 2100, depth: 20, price: 1100 },
        { name: 'Marco Aluminio Reforzado', desc: 'Marco con refuerzos estructurales', width: 700, height: 2100, depth: 40, price: 1350 }
    ],
    'Ventana': [
        { name: 'Ventana Vidrio Transparente', desc: 'Ventana de vidrio transparente templado', width: 400, height: 300, depth: 6, price: 650 },
        { name: 'Ventana Vidrio Esmerilado', desc: 'Ventana con vidrio esmerilado para privacidad', width: 400, height: 300, depth: 6, price: 720 },
        { name: 'Ventana Vidrio Serigrafía', desc: 'Ventana con diseño serigrafía', width: 400, height: 300, depth: 6, price: 850 },
        { name: 'Ventana Vidrio Biselado', desc: 'Ventana con bordes biselados decorativos', width: 400, height: 300, depth: 6, price: 920 },
        { name: 'Ventana Vidrio Tintado', desc: 'Ventana con vidrio tintado', width: 400, height: 300, depth: 6, price: 780 },
        { name: 'Ventana Doble Vidrio', desc: 'Ventana con doble vidrio aislante', width: 400, height: 300, depth: 12, price: 1150 },
        { name: 'Ventana Vidrio Decorado', desc: 'Ventana con diseño decorativo grabado', width: 400, height: 300, depth: 6, price: 950 },
        { name: 'Ventana Vidrio Ahumado', desc: 'Ventana con vidrio ahumado oscuro', width: 400, height: 300, depth: 6, price: 820 },
        { name: 'Ventana Vidrio Texturizado', desc: 'Ventana con textura en relieve', width: 400, height: 300, depth: 6, price: 880 },
        { name: 'Ventana Vidrio Laminado', desc: 'Ventana de seguridad laminada', width: 400, height: 300, depth: 8, price: 1050 }
    ],
    'Panel': [
        { name: 'Panel Lateral Liso', desc: 'Panel lateral sin molduras', width: 600, height: 2100, depth: 18, price: 980 },
        { name: 'Panel Lateral con Moldura', desc: 'Panel lateral decorativo con moldura', width: 600, height: 2100, depth: 18, price: 1150 },
        { name: 'Panel Trasero Gabinete', desc: 'Panel trasero para gabinetes', width: 800, height: 850, depth: 6, price: 450 },
        { name: 'Panel Divisor', desc: 'Panel divisor para estantes', width: 600, height: 850, depth: 18, price: 520 },
        { name: 'Panel Decorativo Frontal', desc: 'Panel frontal decorativo', width: 600, height: 2100, depth: 18, price: 1280 },
        { name: 'Panel Zócalo', desc: 'Panel para zócalo de cocina', width: 2400, height: 150, depth: 18, price: 680 },
        { name: 'Panel Techo', desc: 'Panel para cerrar espacio superior', width: 600, height: 300, depth: 18, price: 420 },
        { name: 'Panel Esquinero', desc: 'Panel especial para esquinas', width: 600, height: 2100, depth: 18, price: 1050 },
        { name: 'Panel Ranurado', desc: 'Panel con ranuras decorativas', width: 600, height: 2100, depth: 18, price: 1180 },
        { name: 'Panel Texturizado', desc: 'Panel con textura en relieve', width: 600, height: 2100, depth: 18, price: 1220 }
    ],
    'Canto': [
        { name: 'Canto PVC 1mm Blanco', desc: 'Canto de PVC 1mm color blanco', width: 22, height: 50000, depth: 1, price: 180 },
        { name: 'Canto PVC 2mm Negro', desc: 'Canto de PVC 2mm color negro', width: 22, height: 50000, depth: 2, price: 220 },
        { name: 'Canto ABS Nogal', desc: 'Canto ABS imitación nogal', width: 22, height: 50000, depth: 1, price: 250 },
        { name: 'Canto ABS Roble', desc: 'Canto ABS imitación roble', width: 22, height: 50000, depth: 1, price: 250 },
        { name: 'Canto Melamina Gris', desc: 'Canto melamina color gris', width: 22, height: 50000, depth: 0.5, price: 150 },
        { name: 'Canto PVC 2mm Wengué', desc: 'Canto PVC color wengué', width: 22, height: 50000, depth: 2, price: 230 },
        { name: 'Canto Aluminio Natural', desc: 'Perfil de aluminio natural', width: 22, height: 3000, depth: 10, price: 380 },
        { name: 'Canto Aluminio Negro', desc: 'Perfil de aluminio negro', width: 22, height: 3000, depth: 10, price: 420 },
        { name: 'Canto Madera Natural', desc: 'Canto de madera natural', width: 22, height: 2400, depth: 2, price: 480 },
        { name: 'Canto PVC Alto Brillo', desc: 'Canto PVC con acabado brillante', width: 22, height: 50000, depth: 2, price: 280 }
    ],
    'Corona': [
        { name: 'Corona Clásica Simple', desc: 'Moldura corona estilo clásico', width: 80, height: 2400, depth: 80, price: 320 },
        { name: 'Corona Moderna Minimalista', desc: 'Corona de diseño minimalista', width: 60, height: 2400, depth: 60, price: 280 },
        { name: 'Corona Decorativa Tallada', desc: 'Corona con detalles tallados', width: 100, height: 2400, depth: 100, price: 450 },
        { name: 'Corona Rústica', desc: 'Corona con acabado rústico', width: 90, height: 2400, depth: 90, price: 380 },
        { name: 'Corona con Iluminación', desc: 'Corona con canal para LED', width: 80, height: 2400, depth: 100, price: 520 },
        { name: 'Corona Esquinera', desc: 'Pieza esquinera para corona', width: 80, height: 80, depth: 80, price: 85 },
        { name: 'Corona Alta', desc: 'Corona de mayor altura', width: 120, height: 2400, depth: 120, price: 480 },
        { name: 'Corona Delgada', desc: 'Corona perfil delgado', width: 40, height: 2400, depth: 40, price: 220 },
        { name: 'Corona Bicolor', desc: 'Corona con dos tonos', width: 80, height: 2400, depth: 80, price: 420 },
        { name: 'Corona Premium', desc: 'Corona de alta calidad', width: 100, height: 2400, depth: 100, price: 550 }
    ],
    'Piso': [
        { name: 'Piso Laminado Roble', desc: 'Piso laminado imitación roble', width: 1200, height: 8, depth: 200, price: 280 },
        { name: 'Piso Laminado Nogal', desc: 'Piso laminado imitación nogal', width: 1200, height: 8, depth: 200, price: 280 },
        { name: 'Piso Vinílico Gris', desc: 'Piso vinílico color gris', width: 1200, height: 5, depth: 200, price: 220 },
        { name: 'Piso Vinílico Madera', desc: 'Piso vinílico imitación madera', width: 1200, height: 5, depth: 200, price: 240 },
        { name: 'Piso Porcelánico Mármol', desc: 'Piso porcelánico imitación mármol', width: 600, height: 10, depth: 600, price: 380 },
        { name: 'Piso Porcelánico Cemento', desc: 'Piso porcelánico acabado cemento', width: 600, height: 10, depth: 600, price: 350 },
        { name: 'Piso Madera Maciza', desc: 'Piso de madera natural maciza', width: 1200, height: 15, depth: 150, price: 580 },
        { name: 'Piso SPC Resistente', desc: 'Piso SPC alta resistencia', width: 1200, height: 6, depth: 200, price: 320 },
        { name: 'Piso Bambú', desc: 'Piso ecológico de bambú', width: 1200, height: 12, depth: 150, price: 420 },
        { name: 'Piso Cerámico Antiderrapante', desc: 'Piso cerámico para cocina', width: 600, height: 10, depth: 600, price: 280 }
    ],
    'Muestrario': [
        { name: 'Muestrario Colores Básicos', desc: 'Set de muestras colores básicos', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Muestrario Maderas', desc: 'Set de muestras acabados madera', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Muestrario Premium', desc: 'Set de muestras acabados premium', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Muestrario Alto Brillo', desc: 'Set de muestras alto brillo', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Muestrario Mate', desc: 'Set de muestras acabado mate', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Muestrario Texturas', desc: 'Set de muestras con texturas', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Muestrario Encimeras', desc: 'Set de muestras de encimeras', width: 150, height: 150, depth: 30, price: 0 },
        { name: 'Muestrario Manijas', desc: 'Display de manijas y tiradores', width: 400, height: 600, depth: 50, price: 0 },
        { name: 'Muestrario Completo', desc: 'Muestrario completo de acabados', width: 300, height: 400, depth: 50, price: 0 },
        { name: 'Muestrario Digital', desc: 'Catálogo digital interactivo', width: 1, height: 1, depth: 1, price: 0 }
    ],
    'Cuadro muestra': [
        { name: 'Cuadro Muestra Blanco', desc: 'Muestra individual color blanco', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Negro', desc: 'Muestra individual color negro', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Nogal', desc: 'Muestra individual nogal', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Roble', desc: 'Muestra individual roble', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Gris', desc: 'Muestra individual gris', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Wengué', desc: 'Muestra individual wengué', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Cerezo', desc: 'Muestra individual cerezo', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Maple', desc: 'Muestra individual maple', width: 100, height: 100, depth: 18, price: 0 },
        { name: 'Cuadro Muestra Personalizado', desc: 'Muestra color personalizado', width: 100, height: 100, depth: 18, price: 50 },
        { name: 'Cuadro Muestra Premium', desc: 'Muestra acabado premium', width: 150, height: 150, depth: 18, price: 0 }
    ],
    'Puerta muestra': [
        { name: 'Puerta Muestra Lisa', desc: 'Muestra puerta lisa', width: 200, height: 300, depth: 18, price: 150 },
        { name: 'Puerta Muestra Moldura', desc: 'Muestra puerta con moldura', width: 200, height: 300, depth: 18, price: 180 },
        { name: 'Puerta Muestra Shaker', desc: 'Muestra puerta shaker', width: 200, height: 300, depth: 18, price: 200 },
        { name: 'Puerta Muestra Vidrio', desc: 'Muestra puerta con vidrio', width: 200, height: 300, depth: 18, price: 220 },
        { name: 'Puerta Muestra Ranurada', desc: 'Muestra puerta ranurada', width: 200, height: 300, depth: 18, price: 190 },
        { name: 'Puerta Muestra Alto Brillo', desc: 'Muestra acabado alto brillo', width: 200, height: 300, depth: 18, price: 250 },
        { name: 'Puerta Muestra Mate', desc: 'Muestra acabado mate', width: 200, height: 300, depth: 18, price: 230 },
        { name: 'Puerta Muestra Rústica', desc: 'Muestra acabado rústico', width: 200, height: 300, depth: 18, price: 210 },
        { name: 'Puerta Muestra Lacada', desc: 'Muestra acabado lacado', width: 200, height: 300, depth: 18, price: 240 },
        { name: 'Puerta Muestra Premium', desc: 'Muestra acabado premium', width: 200, height: 300, depth: 18, price: 280 }
    ],
    'Jaladera': [
        { name: 'Jaladera Perfil Aluminio', desc: 'Jaladera perfil de aluminio', width: 128, height: 20, depth: 30, price: 85 },
        { name: 'Jaladera Acero Inoxidable', desc: 'Jaladera acero inoxidable', width: 128, height: 15, depth: 25, price: 120 },
        { name: 'Jaladera Pomo Circular', desc: 'Pomo circular moderno', width: 30, height: 30, depth: 25, price: 65 },
        { name: 'Jaladera Tirador Largo', desc: 'Tirador largo minimalista', width: 256, height: 12, depth: 30, price: 150 },
        { name: 'Jaladera Integrada', desc: 'Jaladera integrada en puerta', width: 400, height: 30, depth: 20, price: 95 },
        { name: 'Jaladera Cuero', desc: 'Jaladera de cuero natural', width: 150, height: 20, depth: 15, price: 180 },
        { name: 'Jaladera Madera', desc: 'Jaladera de madera maciza', width: 128, height: 25, depth: 30, price: 140 },
        { name: 'Jaladera Negro Mate', desc: 'Jaladera acabado negro mate', width: 128, height: 15, depth: 25, price: 110 },
        { name: 'Jaladera Dorada', desc: 'Jaladera acabado dorado', width: 128, height: 15, depth: 25, price: 160 },
        { name: 'Jaladera Invisible', desc: 'Sistema push to open', width: 50, height: 50, depth: 20, price: 95 }
    ]
}

const colors = ['Blanco', 'Negro', 'Gris', 'Nogal', 'Roble', 'Cerezo', 'Wengué', 'Maple']
const woodGrains = ['Horizontal', 'Vertical', 'Natural']
const edgeBandings = ['PVC 1mm', 'PVC 2mm', 'ABS', 'Melamina', 'Madera']
const handleTypes = ['Perfil Aluminio', 'Tirador Acero', 'Pomo Circular', 'Push to Open', 'Tirador Integrado']
const orientations = ['Horizontal', 'Vertical', 'Ambas']
const tags = ['moderno', 'clásico', 'minimalista', 'rústico', 'premium', 'económico', 'personalizable', 'stock']

function generateSKU(categoryName: string, index: number): string {
    const prefix = categoryName.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}-${String(index).padStart(3, '0')}`
}

function getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)]
}

function getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}

async function main() {
    console.log('🌱 Starting product seeding...')

    // Fetch all categories
    const categories = await prisma.category.findMany({
        where: { status: ProductStatus.ACTIVE }
    })

    if (categories.length === 0) {
        console.log('⚠️  No categories found. Please create categories first.')
        return
    }

    console.log(`📦 Found ${categories.length} categories`)

    let totalProductsCreated = 0

    for (const category of categories) {
        console.log(`\n📁 Processing category: ${category.name}`)

        const templates = productTemplates[category.name as keyof typeof productTemplates]

        if (!templates) {
            console.log(`⚠️  No templates found for category: ${category.name}, skipping...`)
            continue
        }

        for (let i = 0; i < templates.length; i++) {
            const template = templates[i]

            try {
                const product = await prisma.product.create({
                    data: {
                        name: template.name,
                        description: template.desc,
                        sku: generateSKU(category.name, i + 1),
                        categoryId: category.id,
                        status: ProductStatus.ACTIVE,

                        // Dimensions
                        width: template.width,
                        height: template.height,
                        depth: template.depth,
                        weight: Math.round((template.width * template.height * template.depth) / 100000), // Approximate weight
                        dimensionUnit: 'mm',
                        weightUnit: 'kg',

                        // Product characteristics
                        modelName: `Modelo ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
                        colorToneText: getRandomItem(colors),
                        woodGrainText: getRandomItem(woodGrains),
                        edgeBanding: getRandomItem(edgeBandings),
                        faces: Math.random() > 0.5 ? 2 : 1,
                        handleType: getRandomItem(handleTypes),
                        orientation: getRandomItem(orientations),

                        // Dimension ranges for customizable products
                        minWidth: Math.round(template.width * 0.8),
                        maxWidth: Math.round(template.width * 1.3),
                        minHeight: Math.round(template.height * 0.9),
                        maxHeight: Math.round(template.height * 1.2),

                        // Pricing
                        basePrice: template.price,
                        currency: 'MXN',

                        // Images (placeholder URLs)
                        images: [
                            `https://placehold.co/800x600/e5e7eb/1f2937?text=${encodeURIComponent(template.name)}`,
                            `https://placehold.co/800x600/d1d5db/374151?text=${encodeURIComponent(template.name)}+2`,
                            `https://placehold.co/800x600/9ca3af/111827?text=${encodeURIComponent(template.name)}+3`
                        ],
                        thumbnail: `https://placehold.co/400x300/e5e7eb/1f2937?text=${encodeURIComponent(template.name)}`,

                        // Manufacturing
                        isCustomizable: true,
                        leadTime: Math.floor(Math.random() * 14) + 7, // 7-21 days
                        minQuantity: 1,
                        maxQuantity: 50,

                        // SEO and Search
                        tags: getRandomItems(tags, 3),
                        featured: Math.random() > 0.7 // 30% chance of being featured
                    }
                })

                console.log(`  ✅ Created: ${product.name} (${product.sku})`)
                totalProductsCreated++
            } catch (error) {
                console.error(`  ❌ Error creating product ${template.name}:`, error)
            }
        }
    }

    console.log(`\n✨ Seeding completed! Created ${totalProductsCreated} products.`)
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
