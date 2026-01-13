
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Super Mate line data...')

    // 1. Create or Updating Product Line "Super Mate"
    const superMateLine = await prisma.productLine.upsert({
        where: { name: 'Super Mate' },
        update: {},
        create: {
            name: 'Super Mate',
            description: 'Línea de acabados Super Mate',
            code: 'SM',
            sortOrder: 6,
            isActive: true
        }
    })

    console.log(`Product Line: ${superMateLine.name} created/updated`)

    // 2. Define Tones
    const tones = [
        { name: 'Plata', hex: '#E5E4E2' },
        { name: 'Murano', hex: '#F5F5F5' },
        { name: 'Petrol', hex: '#005F6A' },
        { name: 'Calcio', hex: '#F8F9FA' },
        { name: 'Terra', hex: '#E2725B' },
        { name: 'Grays', hex: '#808080' },
        { name: 'Luton', hex: '#A9A9A9' },
    ]

    // 3. Create Tones
    for (const tone of tones) {
        await prisma.productTone.upsert({
            where: {
                lineId_name: {
                    lineId: superMateLine.id,
                    name: tone.name
                }
            },
            update: {
                hexColor: tone.hex
            },
            create: {
                name: tone.name,
                lineId: superMateLine.id,
                hexColor: tone.hex,
                isActive: true
            }
        })
        console.log(`Tone created: ${tone.name}`)
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
