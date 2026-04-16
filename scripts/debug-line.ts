
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const lineId = 'cmikrgywu00029adtiido8v37'

    console.log(`Checking Line ID: ${lineId}`)

    const line = await prisma.productLine.findUnique({
        where: { id: lineId }
    })

    if (!line) {
        console.log('Line NOT found')
    } else {
        console.log('Line found:', line.name)
        
        // Query products by linea field
        const products = await prisma.product.findMany({
            where: { linea: line.name }
        })
        
        console.log('Products count:', products.length)
        if (products.length > 0) {
            console.log('First product:', products[0].name, products[0].id)
        }
    }

    // Also list all lines and their products to see what's available
    const allLines = await prisma.productLine.findMany()

    console.log('\nAll Lines:')
    for (const l of allLines) {
        const products = await prisma.product.count({
            where: { linea: l.name }
        })
        console.log(`- ${l.name} (${l.id}): ${products} products`)
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
