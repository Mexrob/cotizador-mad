
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tonesToUpdate = ['Rojo Brillante', 'Rojo Mate']
    const imageUrl = '/images/tones/rojo.png'

    for (const toneName of tonesToUpdate) {
        const result = await prisma.productTone.updateMany({
            where: {
                name: toneName,
            },
            data: {
                imageUrl: imageUrl,
            },
        })
        console.log(`Updated ${result.count} tones for ${toneName}`)
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
