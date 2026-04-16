import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllProducts() {
    console.log('🚨 ADVERTENCIA: Iniciando eliminación forzada de todos los productos...\n')

    try {
        // Step 1: Backup counts
        console.log('📊 Contando registros antes de eliminar...')
        const productCount = await prisma.product.count()
        const quoteItemCount = await prisma.quoteItem.count()
        const pricingCount = await prisma.productPricing.count()

        console.log(`- Productos: ${productCount}`)
        console.log(`- Quote Items: ${quoteItemCount}`)
        console.log(`- Product Pricing: ${pricingCount}\n`)

        if (productCount === 0) {
            console.log('✅ No hay productos para eliminar.')
            return
        }

        // Step 2: Delete all QuoteItems (they reference products)
        console.log('🗑️  Paso 1/3: Eliminando Quote Items...')
        const deletedQuoteItems = await prisma.quoteItem.deleteMany({})
        console.log(`   ✓ Eliminados ${deletedQuoteItems.count} quote items\n`)

        // Step 3: Delete all ProductPricing
        console.log('🗑️  Paso 2/3: Eliminando Product Pricing...')
        const deletedPricing = await prisma.productPricing.deleteMany({})
        console.log(`   ✓ Eliminados ${deletedPricing.count} registros de pricing\n`)

        // Step 4: Delete all Products
        console.log('🗑️  Paso 3/3: Eliminando Productos...')
        const deletedProducts = await prisma.product.deleteMany({})
        console.log(`   ✓ Eliminados ${deletedProducts.count} productos\n`)

        // Verify deletion
        console.log('✅ Verificando eliminación...')
        const remainingProducts = await prisma.product.count()
        const remainingQuoteItems = await prisma.quoteItem.count()
        const remainingPricing = await prisma.productPricing.count()

        console.log(`- Productos restantes: ${remainingProducts}`)
        console.log(`- Quote Items restantes: ${remainingQuoteItems}`)
        console.log(`- Product Pricing restantes: ${remainingPricing}\n`)

        if (remainingProducts === 0) {
            console.log('✅ ¡Todos los productos han sido eliminados exitosamente!')
        } else {
            console.log('⚠️  Advertencia: Aún quedan productos en la base de datos')
        }

        // Summary
        console.log('\n📋 Resumen:')
        console.log('─────────────────────────────────────')
        console.log(`Quote Items eliminados:  ${deletedQuoteItems.count}`)
        console.log(`Product Pricing eliminados: ${deletedPricing.count}`)
        console.log(`Productos eliminados:    ${deletedProducts.count}`)
        console.log('─────────────────────────────────────\n')

    } catch (error) {
        console.error('❌ Error durante la eliminación:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Execute
deleteAllProducts()
    .then(() => {
        console.log('✅ Script completado exitosamente')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ El script falló:', error)
        process.exit(1)
    })
