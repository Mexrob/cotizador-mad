
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Wood Grains...')

    const grains = ['Horizontal', 'Vertical']

    for (const name of grains) {
        await prisma.woodGrain.upsert({
            where: { name },
            update: {},
            create: {
                name,
                direction: name,
                status: 'ACTIVE'
            }
        })
        console.log(`Seeded WoodGrain: ${name}`)
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
