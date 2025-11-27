import { PrismaClient, ProductStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Product Lines from Excel (Hoja 1, Fila 2)
const PRODUCT_LINES = [
    { name: 'VIDRIO', code: 'VID', description: 'Línea de puertas con vidrio', sortOrder: 1 },
    { name: 'LÍNEA CERÁMICA', code: 'CER', description: 'Línea cerámica', sortOrder: 2 },
    { name: 'LÍNEA ALHÚ', code: 'ALH', description: 'Línea Alhú', sortOrder: 3 },
    { name: 'LÍNEA EUROPA BÁSICA', code: 'EUB', description: 'Línea Europa básica', sortOrder: 4 },
    { name: 'LÍNEA EUROPA SINCRO', code: 'EUS', description: 'Línea Europa synchro', sortOrder: 5 },
    { name: 'LÍNEA GUARARAPES', code: 'GUA', description: 'Línea Guararapes', sortOrder: 6 },
    { name: 'LÍNEA TENERIFE', code: 'TEN', description: 'Línea Tenerife', sortOrder: 7 },
    { name: 'LÍNEA ALTO BRILLO', code: 'ALB', description: 'Línea alto brillo', sortOrder: 8 },
    { name: 'LÍNEA SUPER MATE', code: 'MAT', description: 'Línea super mate', sortOrder: 9 },
    { name: 'LÍNEA FOIL', code: 'FOI', description: 'Línea foil', sortOrder: 10 },
]

// Product Tones by Line (from Excel Hoja 1, rows 12+)
const TONES_BY_LINE: Record<string, Array<{
    name: string
    supportsTwoCars: boolean
    supportsHorizontalGrain?: boolean
    supportsVerticalGrain?: boolean
    hexColor?: string
}>> = {
    'VIDRIO': [
        { name: 'BLANCO', supportsTwoCars: true, hexColor: '#FFFFFF' },
        { name: 'BLANCO BRILLANTE', supportsTwoCars: true, hexColor: '#FFFFFF' },
        { name: 'BLANCO MATE', supportsTwoCars: true, hexColor: '#F5F5F5' },
        { name: 'PAJA', supportsTwoCars: true, hexColor: '#F5DEB3' },
        { name: 'PAJA BRILLANTE', supportsTwoCars: true, hexColor: '#F5DEB3' },
        { name: 'PAJA MATE', supportsTwoCars: true, hexColor: '#E8C896' },
        { name: 'CAPUCHINO', supportsTwoCars: true, hexColor: '#C8A882' },
        { name: 'CAPUCHINO BRILLANTE', supportsTwoCars: true, hexColor: '#C8A882' },
        { name: 'CAPUCHINO MATE', supportsTwoCars: true, hexColor: '#B89672' },
        { name: 'HUMO', supportsTwoCars: true, hexColor: '#708090' },
        { name: 'HUMO BRILLANTE', supportsTwoCars: true, hexColor: '#708090' },
        { name: 'GRIS', supportsTwoCars: true, hexColor: '#808080' },
        { name: 'DEKTON', supportsTwoCars: false },
        { name: 'ABK STONE', supportsTwoCars: false },
        { name: 'XTONE', supportsTwoCars: false },
        { name: 'INFINITY', supportsTwoCars: false },
        { name: 'ANTOLINI', supportsTwoCars: false },
        { name: 'LIOLI', supportsTwoCars: false },
    ],
    'LÍNEA ALHÚ': [
        { name: 'NATURAL', supportsTwoCars: true },
        { name: 'AHUMADO CLARO', supportsTwoCars: true },
        { name: 'BRONCE TEXTURIZADA CON 1 CAPA DE PINTURA', supportsTwoCars: false },
        { name: 'ESPEJO BRONCE DE 6MM', supportsTwoCars: false },
        { name: 'TELA ENCAPSULADA EN VIDRIO ULTRACLARO 4+4', supportsTwoCars: false },
        { name: 'TELA ENCAPSULADA EN VIDRIO CLARO 4+4', supportsTwoCars: false },
        { name: 'ESPEJO CLARO ANTICADO DE 6MM', supportsTwoCars: false },
        { name: 'FILTRASOL TEXTURIZADO DE 6MM', supportsTwoCars: false },
        { name: 'VIDRIO CLARO TEXTURIZADO DE 6MM CON PINTURA', supportsTwoCars: false },
    ],
    'LÍNEA EUROPA BÁSICA': [
        { name: 'YORK', supportsTwoCars: true },
        { name: 'CHELSEA', supportsTwoCars: true },
        { name: 'SOHO', supportsTwoCars: true },
        { name: 'GALES', supportsTwoCars: true },
        { name: 'LIVERPOOL', supportsTwoCars: true },
    ],
    'LÍNEA EUROPA SINCRO': [
        { name: 'ROMA', supportsTwoCars: true },
        { name: 'PARMA', supportsTwoCars: true },
        { name: 'GENOVA', supportsTwoCars: true },
        { name: 'PISA', supportsTwoCars: true },
        { name: 'TURÍN', supportsTwoCars: true },
    ],
    'LÍNEA GUARARAPES': [
        { name: 'ESTÁNDAR', supportsTwoCars: true },
    ],
    'LÍNEA TENERIFE': [
        { name: 'OBSIDIANA', supportsTwoCars: true },
        { name: 'MAGNESIO', supportsTwoCars: true },
        { name: 'TOPACIO', supportsTwoCars: true },
    ],
    'LÍNEA ALTO BRILLO': [
        { name: 'MURANO', supportsTwoCars: true },
        { name: 'PETROL', supportsTwoCars: true },
        { name: 'CALCIO', supportsTwoCars: true },
        { name: 'ALASKA', supportsTwoCars: true },
    ],
    'LÍNEA SUPER MATE': [
        { name: 'PLATA', supportsTwoCars: true },
        { name: 'NEGRO MATE', supportsTwoCars: false },
        { name: 'AZUL MARINO MATE', supportsTwoCars: false },
        { name: 'AZUL CLARO MATE', supportsTwoCars: false },
    ],
    'LÍNEA FOIL': [
        { name: 'DRIFT WOOD', supportsTwoCars: true, supportsHorizontalGrain: true, supportsVerticalGrain: true },
        { name: 'BLANCO ELEGANTE', supportsTwoCars: false, supportsHorizontalGrain: true, supportsVerticalGrain: false },
        { name: 'NOGAL WOODLOOK', supportsTwoCars: true, supportsHorizontalGrain: true, supportsVerticalGrain: true },
        { name: 'GRIS ELEGANT', supportsTwoCars: false, supportsHorizontalGrain: true, supportsVerticalGrain: false },
        { name: 'GRIS CLARO ELEGANTE', supportsTwoCars: false, supportsHorizontalGrain: true, supportsVerticalGrain: false },
        { name: 'ALMENDRA ELEGANTE', supportsTwoCars: true, supportsHorizontalGrain: true, supportsVerticalGrain: true },
    ],
}

// Handle Models (from Excel Hoja 1, rows 5-10)
const HANDLE_MODELS = [
    { name: 'JALADERA MODELO SORENTO A NEGRO', model: 'SORENTO A', finish: 'NEGRO', price: 150.00, sortOrder: 1 },
    { name: 'JALADERA MODELO SORENTO L NEGRO', model: 'SORENTO L', finish: 'NEGRO', price: 200.00, sortOrder: 2 },
    { name: 'JALADERA MODELO SORENTO G NEGRO', model: 'SORENTO G', finish: 'NEGRO', price: 250.00, sortOrder: 3 },
    { name: 'JALADERA MODELO SORENTO A ALUMINIO', model: 'SORENTO A', finish: 'ALUMINIO', price: 180.00, sortOrder: 4 },
    { name: 'JALADERA MODELO SORENTO L ALUMINIO', model: 'SORENTO L', finish: 'ALUMINIO', price: 230.00, sortOrder: 5 },
    { name: 'JALADERA MODELO SORENTO G ALUMINIO', model: 'SORENTO G', finish: 'ALUMINIO', price: 280.00, sortOrder: 6 },
]

async function main() {
    console.log('🌱 Starting import from Excel data...\n')

    // 1. Create or find Puertas category
    let puertasCategory = await prisma.category.findFirst({
        where: { name: 'Puertas' }
    })

    if (!puertasCategory) {
        puertasCategory = await prisma.category.create({
            data: {
                name: 'Puertas',
                description: 'Puertas de cocina MODULE 2025',
                status: ProductStatus.ACTIVE,
            }
        })
    }
    console.log(`✅ Category: Puertas\n`)

    // 2. Create Product Lines and Tones
    for (const lineData of PRODUCT_LINES) {
        const line = await prisma.productLine.upsert({
            where: { name: lineData.name },
            update: lineData,
            create: lineData,
        })

        console.log(`📦 Línea: ${line.name}`)

        // Create tones for this line
        const tones = TONES_BY_LINE[lineData.name] || []
        for (const toneData of tones) {
            await prisma.productTone.upsert({
                where: {
                    lineId_name: {
                        lineId: line.id,
                        name: toneData.name,
                    }
                },
                update: {
                    supportsTwoCars: toneData.supportsTwoCars,
                    supportsHorizontalGrain: toneData.supportsHorizontalGrain || false,
                    supportsVerticalGrain: toneData.supportsVerticalGrain || false,
                    hexColor: toneData.hexColor,
                },
                create: {
                    name: toneData.name,
                    lineId: line.id,
                    supportsTwoCars: toneData.supportsTwoCars,
                    supportsHorizontalGrain: toneData.supportsHorizontalGrain || false,
                    supportsVerticalGrain: toneData.supportsVerticalGrain || false,
                    hexColor: toneData.hexColor,
                }
            })
        }

        console.log(`   ✓ ${tones.length} tonos creados`)

        // Create base product for this line
        const sku = `PTA-${lineData.code}-LINE`

        await prisma.product.upsert({
            where: { sku },
            update: {
                name: `Puerta ${lineData.name}`,
                description: `Puerta de la ${lineData.name} modelo LINE (liscio)`,
            },
            create: {
                name: `Puerta ${lineData.name}`,
                description: `Puerta de la ${lineData.name} modelo LINE (liscio). Producto base para configuración guiada.`,
                sku,
                categoryId: puertasCategory.id,
                lineId: line.id,
                status: ProductStatus.ACTIVE,

                // Precio base (a definir por línea - placeholder)
                basePrice: 0.05, // $0.05 MXN por mm²
                currency: 'MXN',

                // Dimensiones estándar
                width: 700,
                height: 2100,
                depth: 18,
                dimensionUnit: 'mm',

                // Características
                modelName: 'LINE',
                isCustomizable: true,
                leadTime: 15,
                minQuantity: 1,

                // Rangos de dimensiones
                minWidth: 300,
                maxWidth: 1500,
                minHeight: 500,
                maxHeight: 2400,

                // Metadata
                tags: ['puerta', 'cocina', lineData.name.toLowerCase()],
                images: [],
                featured: false,
            }
        })

        console.log(`   ✓ Producto base creado\n`)
    }

    // 3. Create Handle Models
    console.log('🔧 Creando modelos de jaladeras...')
    for (const handleData of HANDLE_MODELS) {
        await prisma.handleModel.upsert({
            where: { name: handleData.name },
            update: {
                model: handleData.model,
                finish: handleData.finish,
                price: handleData.price,
                sortOrder: handleData.sortOrder,
            },
            create: handleData,
        })
        console.log(`   ✓ ${handleData.name}`)
    }

    console.log('\n✨ Import completed successfully!')
    console.log(`\nSummary:`)
    console.log(`- ${PRODUCT_LINES.length} Product Lines`)
    console.log(`- ${Object.values(TONES_BY_LINE).reduce((sum, tones) => sum + tones.length, 0)} Product Tones`)
    console.log(`- ${HANDLE_MODELS.length} Handle Models`)
    console.log(`- ${PRODUCT_LINES.length} Base Products`)
}

main()
    .catch((e) => {
        console.error('❌ Error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
