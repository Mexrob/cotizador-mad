import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🚨 Starting deletion of test-imported products...\n')

    try {
        // Identify test products by SKU pattern: contains '_' and ends with '_1CARA' or '_2CARAS'
        const testProducts = await prisma.product.findMany({
            where: {
                AND: [
                    { sku: { contains: '_' } },
                    {
                        OR: [
                            { sku: { endsWith: '_1CARA' } },
                            { sku: { endsWith: '_2CARAS' } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                sku: true,
                name: true
            }
        })

        console.log(`📊 Found ${testProducts.length} test products to delete`)

        if (testProducts.length === 0) {
            console.log('✅ No test products found. Exiting.')
            return
        }

        const productIds = testProducts.map(p => p.id)

        // Check counts before deletion
        const quoteItemsCount = await prisma.quoteItem.count({
            where: {
                productId: {
                    in: productIds
                }
            }
        })

        const pricingCount = await prisma.productPricing.count({
            where: {
                productId: {
                    in: productIds
                }
            }
        })

        console.log(`- Quote Items to delete: ${quoteItemsCount}`)
        console.log(`- Product Pricing to delete: ${pricingCount}`)
        console.log(`- Products to delete: ${testProducts.length}\n`)

        // Start transaction for safe deletion
        await prisma.$transaction(async (tx) => {
            // Delete quote items first
            console.log('🗑️  Step 1/3: Deleting quote items...')
            const deletedQuoteItems = await tx.quoteItem.deleteMany({
                where: {
                    productId: {
                        in: productIds
                    }
                }
            })
            console.log(`   ✓ Deleted ${deletedQuoteItems.count} quote items\n`)

            // Delete product pricing records
            console.log('🗑️  Step 2/3: Deleting product pricing...')
            const deletedPricing = await tx.productPricing.deleteMany({
                where: {
                    productId: {
                        in: productIds
                    }
                }
            })
            console.log(`   ✓ Deleted ${deletedPricing.count} product pricing records\n`)

            // Delete products
            console.log('🗑️  Step 3/3: Deleting products...')
            const deletedProducts = await tx.product.deleteMany({
                where: {
                    id: {
                        in: productIds
                    }
                }
            })
            console.log(`   ✓ Deleted ${deletedProducts.count} products\n`)
        })

        // Verify deletion
        console.log('✅ Verifying deletion...')
        const remainingQuoteItems = await prisma.quoteItem.count({
            where: {
                productId: {
                    in: productIds
                }
            }
        })

        const remainingPricing = await prisma.productPricing.count({
            where: {
                productId: {
                    in: productIds
                }
            }
        })

        const remainingProducts = await prisma.product.count({
            where: {
                id: {
                    in: productIds
                }
            }
        })

        console.log(`- Remaining Quote Items: ${remainingQuoteItems}`)
        console.log(`- Remaining Product Pricing: ${remainingPricing}`)
        console.log(`- Remaining Products: ${remainingProducts}\n`)

        if (remainingProducts === 0) {
            console.log('✅ All test products and related data deleted successfully!')
        } else {
            console.log('⚠️  Warning: Some products may still remain in the database')
        }

        // Summary
        console.log('\n📋 Summary:')
        console.log('─────────────────────────────────────')
        console.log(`Test Products identified: ${testProducts.length}`)
        console.log(`Quote Items deleted:      ${quoteItemsCount}`)
        console.log(`Product Pricing deleted:  ${pricingCount}`)
        console.log(`Products deleted:         ${testProducts.length}`)
        console.log('─────────────────────────────────────\n')

    } catch (error) {
        console.error('❌ Error during deletion:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

// Execute
main()
    .then(() => {
        console.log('✅ Script completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Script failed:', error)
        process.exit(1)
    })