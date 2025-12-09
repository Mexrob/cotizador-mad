import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const TONES = [
    'Blanco - Brillante',
    'Blanco - Mate',
    'Paja - Brillante',
    'Paja - Mate',
    'Capuchino - Brillante',
    'Capuchino - Mate',
    'Humo - Brillante',
    'Humo - Mate',
    'Gris - Brillante',
    'Gris - Mate',
    'Rojo - Brillante',
    'Rojo - Mate',
    'Negro - Brillante',
    'Negro - Mate',
]

const HANDLES = [
    'Sorento A Inox',
    'Sorento A Negro',
    'Sorento G Inox',
    'Sorento G Negro',
    'Sorento L Inox',
    'Sorento L Negro',
]

async function main() {
    console.log('Seeding kit data...')

    // 1. Ensure ProductLine "Vidrio" exists
    let line = await prisma.productLine.findUnique({
        where: { name: 'Vidrio' }
    })

    if (!line) {
        console.log('Creating ProductLine "Vidrio"...')
        line = await prisma.productLine.create({
            data: {
                name: 'Vidrio',
                description: 'Línea de vidrios y espejos',
                isActive: true
            }
        })
    } else {
        console.log('ProductLine "Vidrio" already exists.')
    }

    // 2. Ensure ProductTones exist
    for (const toneName of TONES) {
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
                    isActive: true
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
            // We need to parse the model and finish from the name
            // Format: "Model Finish" (e.g. "Sorento A Inox")
            const parts = handleName.split(' ')
            const model = parts.slice(0, -1).join(' ') // "Sorento A"
            const finish = parts[parts.length - 1] // "Inox"

            await prisma.handleModel.create({
                data: {
                    name: handleName,
                    model: model,
                    finish: finish,
                    price: 0, // Set default price, can be updated later
                    isActive: true
                }
            })
        } else {
            console.log(`HandleModel "${handleName}" already exists.`)
        }
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
