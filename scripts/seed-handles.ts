import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const imageMappings: Record<string, string> = {
    'SORENTO A': '/images/handles/sorento-a.png',
    'SORENTO L': '/images/handles/sorento-l.png',
    'SORENTO G': '/images/handles/sorento-g.png',
    'ROMULO': '/images/handles/romulo.png',
    'REMO': '/images/handles/remo.png',
};

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
        const imageUrl = imageMappings[handle.model] || null;
        await prisma.handleModel.upsert({
            where: { name: handle.name },
            update: {
                model: handle.model,
                finish: handle.finish,
                price: handle.price,
                imageUrl: imageUrl,
            },
            create: {
                name: handle.name,
                model: handle.model,
                finish: handle.finish,
                price: handle.price,
                imageUrl: imageUrl,
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
