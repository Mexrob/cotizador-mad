
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const lineName = 'Vidrio'
    const imageUrl = '/images/lines/vidrio.png'

    const line = await prisma.productLine.update({
        where: { name: lineName },
        data: {
            imageUrl: imageUrl,
        },
    })

    console.log(`Updated line ${line.name} with image ${line.imageUrl}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
