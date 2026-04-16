import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ALUMINUM_TONES = [
    'Natural',
    'Negro',
    'Champagne',
]

const GLASS_TONES = [
    'Natural',
    'Ahumado Claro',
    'Bronce texturizado con 1 capa de pintura',
    'Espejo bronce de 6mm',
    'Tela encapsulada en vidrio ultraclaro de 4+4',
    'Tela encapsulada en vidrio claro de 4+4',
    'Espejo claro Anticado de 6mm',
    'Filtrasol Texturizado de 6mm',
    'Vidrio claro texturizado de 6mm con pintura',
    'Vidrio Cristazul texturizado de 6mm',
]

const HANDLES = [
    'Romulo Aluminio',
    'Romulo Negro',
    'Remo Negro',
    'Remo Aluminio',
]

async function main() {
    console.log('Seeding Alhú data...')

    // 1. Ensure ProductLine "Línea Alhú" exists
    let line = await prisma.productLine.findUnique({
        where: { name: 'Línea Alhú' }
    })

    if (!line) {
        console.log('Creating ProductLine "Línea Alhú"...')
        line = await prisma.productLine.create({
            data: {
                name: 'Línea Alhú',
                description: 'Línea de perfiles de aluminio y vidrio',
                isActive: true
            }
        })
    } else {
        console.log('ProductLine "Línea Alhú" already exists.')
    }

    // 2. Ensure ProductTones (Glass) exist
    // Note: Aluminum tones will be stored as "edgeBanding" or similar in the item, 
    // but we can also create them as tones if needed. 
    // For now, let's create the Glass tones as ProductTones linked to the line.
    for (const toneName of GLASS_TONES) {
        const tone = await prisma.productTone.findFirst({
            where: {
                lineId: line.id,
                name: toneName
            }
        })

        if (!tone) {
            console.log(`Creating ProductTone "${toneName}"...`)
            await prisma.productTone.create({
                data: {
                    name: toneName,
                    lineId: line.id,
                    isActive: true,
                    // Store base price in priceAdjustment or handled in code?
                    // User said "Precio Base $4440.00 MXN". 
                    // Let's store it as priceAdjustment for now to be safe, though wizard might hardcode it.
                    priceAdjustment: 4440.00
                }
            })
        } else {
            console.log(`ProductTone "${toneName}" already exists.`)
        }
    }

    // 3. Ensure HandleModels exist
    for (const handleName of HANDLES) {
        const handle = await prisma.handleModel.findUnique({
            where: { name: handleName }
        })

        if (!handle) {
            console.log(`Creating HandleModel "${handleName}"...`)
            // Parse for model/finish
            const parts = handleName.split(' ')
            const model = parts[0] // "Romulo" or "Remo"
            const finish = parts.slice(1).join(' ') // "Aluminio" or "Negro"

            await prisma.handleModel.create({
                data: {
                    name: handleName,
                    model: model,
                    finish: finish,
                    price: 0, // Costs not specified in prompt, defaulting to 0
                    isActive: true
                }
            })
        } else {
            console.log(`HandleModel "${handleName}" already exists.`)
        }
    }

    // 4. Create base product for Alhú line if not exists (needed for foreign keys)
    const category = await prisma.category.findFirst({ where: { name: 'Puertas' } })
        || await prisma.category.create({ data: { name: 'Puertas' } })

    const product = await prisma.product.findFirst({
        where: { linea: 'LÍNEA ALHÚ' }
    })

    if (!product) {
        console.log('Creating base Product for Alhú...')
        await prisma.product.create({
            data: {
                name: 'Puerta Alhú',
                categoryId: category.id,
                linea: 'LÍNEA ALHÚ',
                categoria: 'Puerta',
                coleccion: 'LÍNEA ALHÚ',
                precioBaseM2: 4440.00,
            }
        })
    }

    console.log('Done.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
