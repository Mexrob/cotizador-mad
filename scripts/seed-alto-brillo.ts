
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Alto Brillo...')

    // 1. Create Product Line
    const line = await prisma.productLine.upsert({
        where: { name: 'Alto Brillo' },
        update: {},
        create: {
            name: 'Alto Brillo',
            description: 'Línea de acabados de alto brillo',
            isActive: true,
            sortOrder: 4,
            imageUrl: '/images/lines/alto-brillo.png'
        }
    })

    console.log('Product Line created:', line.name)

    // 2. Create Tones
    const tones = [
        { name: 'Alaska', hex: '#EBEBEB' },
        { name: 'Obsidiana', hex: '#1A1A1A' },
        { name: 'Magnesio', hex: '#4A4A4A' },
        { name: 'Topacio', hex: '#D4AF37' } // Gold-ish? Assuming
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
                lineId: line.id,
                name: tone.name,
                hexColor: tone.hex,
                isActive: true
            }
        })
        console.log(`Tone created: ${tone.name}`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
