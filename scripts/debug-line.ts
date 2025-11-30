
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const lineId = 'cmikrgywu00029adtiido8v37'

    console.log(`Checking Line ID: ${lineId}`)

    const line = await prisma.productLine.findUnique({
        where: { id: lineId },
        include: { products: true }
    })

    if (!line) {
        console.log('Line NOT found')
    } else {
        console.log('Line found:', line.name)
        console.log('Products count:', line.products.length)
        if (line.products.length > 0) {
            console.log('First product:', line.products[0].name, line.products[0].id)
        }
    }

    // Also list all lines and their products to see what's available
    const allLines = await prisma.productLine.findMany({
        include: { products: true }
    })

    console.log('\nAll Lines:')
    allLines.forEach(l => {
        console.log(`- ${l.name} (${l.id}): ${l.products.length} products`)
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
