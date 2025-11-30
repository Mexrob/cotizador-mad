
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const tonesToUpdate = ['Blanco Brillante', 'Blanco Mate']
    const imageUrl = '/images/tones/blanco.png'

    for (const toneName of tonesToUpdate) {
        // We need to find the tone first because name is not unique (it depends on lineId)
        // But since we want to update ALL "Blanco Brillante" tones regardless of line, we can use updateMany
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
