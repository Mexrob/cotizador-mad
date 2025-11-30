
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const products = await prisma.product.findMany({
        include: { line: true }
    })

    console.log(`Total Products: ${products.length}`)
    products.forEach(p => {
        console.log(`- ${p.name} (${p.id}) -> Line: ${p.line?.name || 'None'}`)
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
