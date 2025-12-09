import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const handles = [
    { name: 'Sorento A Negro', model: 'SORENTO A', finish: 'NEGRO', price: 890.00 },
    { name: 'Sorento L Negro', model: 'SORENTO L', finish: 'NEGRO', price: 890.00 },
    { name: 'Sorento G Negro', model: 'SORENTO G', finish: 'NEGRO', price: 980.00 },
    { name: 'Sorento A Aluminio', model: 'SORENTO A', finish: 'ALUMINIO', price: 890.00 },
    { name: 'Sorento L Aluminio', model: 'SORENTO L', finish: 'ALUMINIO', price: 890.00 },
    { name: 'Sorento G Aluminio', model: 'SORENTO G', finish: 'ALUMINIO', price: 980.00 },
    { name: 'Romulo Aluminio', model: 'ROMULO', finish: 'ALUMINIO', price: 480.00 },
    { name: 'Romulo Negro', model: 'ROMULO', finish: 'NEGRO', price: 480.00 },
    { name: 'Remo Negro', model: 'REMO', finish: 'NEGRO', price: 480.00 },
    { name: 'Remo Aluminio', model: 'REMO', finish: 'ALUMINIO', price: 480.00 },
]

async function main() {
    console.log('Seeding handles...')

    for (const handle of handles) {
        await prisma.handleModel.upsert({
            where: { name: handle.name },
            update: {
                model: handle.model,
                finish: handle.finish,
                price: handle.price,
            },
            create: {
                name: handle.name,
                model: handle.model,
                finish: handle.finish,
                price: handle.price,
            },
        })
        console.log(`✓ Created/Updated: ${handle.name}`)
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
