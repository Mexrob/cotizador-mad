
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const imageUrl = '/images/handles/sorento-g.png'

    const result = await prisma.handleModel.updateMany({
        where: {
            name: 'Sorento G',
        },
        data: {
            imageUrl: imageUrl,
        },
    })
    console.log(`Updated ${result.count} handles for Sorento G`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
