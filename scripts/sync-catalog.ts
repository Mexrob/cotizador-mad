import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncCatalog() {
    console.log('🚀 Iniciando sincronización del catálogo con KitWizard...\n')

    try {
        // 1. Obtener o Crear Categoría Base
        let category = await prisma.category.findFirst({
            where: { name: 'Puertas' }
        })

        if (!category) {
            console.log('📦 Creando categoría "Puertas"...')
            category = await prisma.category.create({
                data: {
                    name: 'Puertas',
                    description: 'Categoría para productos configurables del KitWizard',
                    status: 'ACTIVE'
                }
            })
        }

        // 2. Definir Líneas y Tonos
        const config = [
            {
                name: 'Vidrio',
                description: 'Línea de vidrios y espejos',
                tones: [
                    { name: 'Blanco - Brillante', price: 4940 },
                    { name: 'Blanco - Mate', price: 5100 },
                    { name: 'Paja - Brillante', price: 4940 },
                    { name: 'Paja - Mate', price: 5100 },
                    { name: 'Capuchino - Brillante', price: 4940 },
                    { name: 'Capuchino - Mate', price: 5100 },
                    { name: 'Humo - Brillante', price: 4940 },
                    { name: 'Humo - Mate', price: 5100 },
                    { name: 'Gris - Brillante', price: 4940 },
                    { name: 'Gris - Mate', price: 5100 },
                    { name: 'Rojo - Brillante', price: 5100 },
                    { name: 'Rojo - Mate', price: 5200 },
                    { name: 'Negro - Brillante', price: 4940 },
                    { name: 'Negro - Mate', price: 5100 }
                ]
            },
            {
                name: 'Cerámica',
                description: 'Línea Cerámica Premium',
                tones: [
                    { name: 'Dekton', price: 2600 },
                    { name: 'Abk Stone', price: 2600 },
                    { name: 'Xtone', price: 2600 },
                    { name: 'Infinity', price: 2600 },
                    { name: 'Antolini', price: 2600 },
                    { name: 'Lioli', price: 2600 }
                ]
            },
            {
                name: 'Línea Alhú',
                description: 'Puertas de aluminio y vidrio',
                tones: [
                    { name: 'Default', price: 4440 }
                ]
            },
            {
                name: 'Europea Básica',
                description: 'Línea Europea Estándar',
                tones: [
                    { name: 'Default', price: 977 }
                ]
            },
            {
                name: 'Europea Sincro',
                description: 'Línea Europea con Textura Sincronizada',
                tones: [
                    { name: 'Default', price: 1400 }
                ]
            },
            {
                name: 'Alto Brillo',
                description: 'Línea Alto Brillo Premium',
                tones: [
                    { name: 'Default', price: 2500 } // Precio base estimado
                ]
            },
            {
                name: 'Super Mate',
                description: 'Línea Super Mate Soft Touch',
                tones: [
                    { name: 'Default', price: 2500 } // Precio base estimado
                ]
            }
        ]

        // 3. Crear Líneas, Tonos y Productos Base
        for (const item of config) {
            console.log(`\n🛠️  Procesando línea: ${item.name}...`)
            
            let line = await prisma.productLine.upsert({
                where: { name: item.name },
                update: { description: item.description },
                create: {
                    name: item.name,
                    description: item.description,
                    isActive: true
                }
            })

            // Crear Producto Base para la línea si no existe
            const sku = `KIT-${item.name.replace(/\s+/g, '-').toUpperCase()}`
            await prisma.product.upsert({
                where: { sku },
                update: { 
                    name: `Puerta ${item.name}`,
                    categoryId: category.id,
                    lineId: line.id
                },
                create: {
                    name: `Puerta ${item.name}`,
                    sku,
                    description: `Producto base para configuración de ${item.name}`,
                    categoryId: category.id,
                    lineId: line.id,
                    status: 'ACTIVE',
                    basePrice: item.tones[0].price,
                    isCustomizable: true
                }
            })

            // Crear Tonos
            for (const toneData of item.tones) {
                await prisma.productTone.upsert({
                    where: {
                        lineId_name: {
                            lineId: line.id,
                            name: toneData.name
                        }
                    },
                    update: { priceAdjustment: toneData.price },
                    create: {
                        name: toneData.name,
                        lineId: line.id,
                        priceAdjustment: toneData.price,
                        isActive: true
                    }
                })
            }
            console.log(`   ✓ Línea ${item.name} y sus tonos sincronizados.`)
        }

        // 4. Sincronizar Jaladeras
        console.log('\n🚪 Sincronizando jaladeras...')
        const handles = [
            { name: 'Sorento A Negro', price: 890, model: 'Sorento A', finish: 'Negro' },
            { name: 'Sorento L Negro', price: 890, model: 'Sorento L', finish: 'Negro' },
            { name: 'Sorento G Negro', price: 980, model: 'Sorento G', finish: 'Negro' },
            { name: 'Sorento A Aluminio', price: 890, model: 'Sorento A', finish: 'Aluminio' },
            { name: 'Sorento L Aluminio', price: 890, model: 'Sorento L', finish: 'Aluminio' },
            { name: 'Sorento G Aluminio', price: 980, model: 'Sorento G', finish: 'Aluminio' },
            { name: 'Romulo Aluminio', price: 480, model: 'Romulo', finish: 'Aluminio' },
            { name: 'Romulo Negro', price: 480, model: 'Romulo', finish: 'Negro' },
            { name: 'Remo Negro', price: 480, model: 'Remo', finish: 'Negro' },
            { name: 'Remo Aluminio', price: 480, model: 'Remo', finish: 'Aluminio' }
        ]

        for (const h of handles) {
            await prisma.handleModel.upsert({
                where: { name: h.name },
                update: { price: h.price },
                create: {
                    name: h.name,
                    model: h.model,
                    finish: h.finish,
                    price: h.price,
                    isActive: true
                }
            })
        }
        console.log('   ✓ Jaladeras sincronizadas.')

        console.log('\n✅ Sincronización completada con éxito.')

    } catch (error) {
        console.error('\n❌ Error durante la sincronización:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

syncCatalog()
