import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Europea Sincro data...')

    // 1. Create Product Line
    const line = await prisma.productLine.upsert({
        where: { name: 'Europea Sincro' },
        update: {},
        create: {
            name: 'Europea Sincro',
            description: 'Puertas con acabado europeo sincro',
        }
    })
    console.log('Created/Updated Product Line:', line.name)

    // 2. Create Product Tones
    const tones = [
        { name: 'Roma', price: 1400 },
        { name: 'Parma', price: 1400 },
        { name: 'Genova', price: 1400 },
        { name: 'Pisa', price: 1400 },
        { name: 'Turín', price: 1400 },
    ]

    for (const tone of tones) {
        await prisma.productTone.upsert({
            where: {
                lineId_name: {
                    lineId: line.id,
                    name: tone.name
                }
            },
            update: {},
            create: {
                name: tone.name,
                lineId: line.id,
                imageUrl: `/images/tones/${tone.name.toLowerCase()}.jpg` // Placeholder
            }
        })
    }
    console.log('Seeded Tones')

    console.log('Done!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
