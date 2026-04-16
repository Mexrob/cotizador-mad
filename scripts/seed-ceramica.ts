import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Creating Cerámica product line...')

    // Create or update Cerámica product line
    const ceramica = await prisma.productLine.upsert({
        where: { name: 'Cerámica' },
        update: {
            description: 'Puertas con acabado cerámico de alta resistencia',
        },
        create: {
            name: 'Cerámica',
            description: 'Puertas con acabado cerámico de alta resistencia',
        },
    })

    console.log(`✓ Created/Updated Cerámica line: ${ceramica.id}`)

    // Find the Puertas category
    const category = await prisma.category.findFirst({
        where: { name: 'Puertas' }
    })

    if (!category) {
        console.error('Error: Category "Puertas" not found. Please create it first.')
        process.exit(1)
    }

    // Create a base product for Cerámica line
    const existingProduct = await prisma.product.findFirst({
        where: { linea: 'LÍNEA CERÁMICA' }
    })

    if (!existingProduct) {
        const product = await prisma.product.create({
            data: {
                name: 'Puerta Cerámica Personalizada',
                linea: 'LÍNEA CERÁMICA',
                categoria: 'Puerta',
                coleccion: 'LÍNEA CERÁMICA',
                precioBaseM2: 2600.00,
                categoryId: category.id,
                puertaAnchoMin: 300,
                puertaAnchoMax: 1500,
                puertaAltoMin: 500,
                puertaAltoMax: 2400,
            }
        })
        console.log(`✓ Created product: ${product.name}`)
    } else {
        console.log(`✓ Product already exists: ${existingProduct.name}`)
    }

    // Create ceramic tones
    const ceramicTones = [
        'Dekton',
        'Abk Stone',
        'Xtone',
        'Infinity',
        'Antolini',
        'Lioli',
    ]

    for (const toneName of ceramicTones) {
        const tone = await prisma.productTone.upsert({
            where: {
                lineId_name: {
                    lineId: ceramica.id,
                    name: toneName,
                }
            },
            update: {},
            create: {
                name: toneName,
                lineId: ceramica.id,
                hexColor: '#D4C5B9', // Neutral ceramic color
                priceAdjustment: 0,
            },
        })
        console.log(`✓ Created/Updated tone: ${tone.name}`)
    }

    console.log('Seeding completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
