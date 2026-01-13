import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Europea Básica data...')

    // 1. Create Product Line
    const line = await prisma.productLine.upsert({
        where: { name: 'Europea Básica' },
        update: {},
        create: {
            name: 'Europea Básica',
            description: 'Puertas con acabado europeo básico',
        }
    })
    console.log('Created/Updated Product Line:', line.name)

    // 2. Create Product Tones
    const tones = [
        { name: 'York', price: 977 },
        { name: 'Chelsea', price: 977 },
        { name: 'Soho', price: 977 },
        { name: 'Gales', price: 977 },
        { name: 'Liverpool', price: 977 },
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
