
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup for production...\n')
  
  try {
    // Step 1: Delete QuoteItems (depends on Quote and Product)
    console.log('1️⃣ Deleting quote items...')
    const deletedQuoteItems = await prisma.quoteItem.deleteMany({})
    console.log(`   ✅ Deleted ${deletedQuoteItems.count} quote items`)
    
    // Step 2: Delete QuoteShares (depends on Quote and User)
    console.log('2️⃣ Deleting quote shares...')
    const deletedQuoteShares = await prisma.quoteShare.deleteMany({})
    console.log(`   ✅ Deleted ${deletedQuoteShares.count} quote shares`)
    
    // Step 3: Delete Quotes (depends on User)
    console.log('3️⃣ Deleting quotes...')
    const deletedQuotes = await prisma.quote.deleteMany({})
    console.log(`   ✅ Deleted ${deletedQuotes.count} quotes`)
    
    // Step 4: Delete ProductPricing (depends on Product)
    console.log('4️⃣ Deleting product pricing...')
    const deletedProductPricing = await prisma.productPricing.deleteMany({})
    console.log(`   ✅ Deleted ${deletedProductPricing.count} product pricing records`)
    
    // Step 5: Delete Products (depends on Category)
    console.log('5️⃣ Deleting products...')
    const deletedProducts = await prisma.product.deleteMany({})
    console.log(`   ✅ Deleted ${deletedProducts.count} products`)
    
    // Step 6: Delete Categories (handle hierarchy carefully)
    console.log('6️⃣ Deleting categories...')
    // First delete child categories (those with parentId)
    const deletedChildCategories = await prisma.category.deleteMany({
      where: {
        parentId: { not: null }
      }
    })
    console.log(`   ✅ Deleted ${deletedChildCategories.count} child categories`)
    
    // Then delete parent categories
    const deletedParentCategories = await prisma.category.deleteMany({
      where: {
        parentId: null
      }
    })
    console.log(`   ✅ Deleted ${deletedParentCategories.count} parent categories`)
    
    // Step 7: Delete Materials
    console.log('7️⃣ Deleting materials...')
    const deletedMaterials = await prisma.material.deleteMany({})
    console.log(`   ✅ Deleted ${deletedMaterials.count} materials`)
    
    // Step 8: Delete Hardware
    console.log('8️⃣ Deleting hardware...')
    const deletedHardware = await prisma.hardware.deleteMany({})
    console.log(`   ✅ Deleted ${deletedHardware.count} hardware items`)
    
    // Step 9: Delete example users (keep only admin)
    console.log('9️⃣ Deleting example users (keeping admin)...')
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@cocinaslujo.mx'
        }
      }
    })
    console.log(`   ✅ Deleted ${deletedUsers.count} example users`)
    
    // Step 10: Delete Company Settings (example data)
    console.log('🔟 Deleting example company settings...')
    const deletedCompanySettings = await prisma.companySettings.deleteMany({})
    console.log(`   ✅ Deleted ${deletedCompanySettings.count} company settings`)
    
    // Step 11: Delete Tax Settings
    console.log('1️⃣1️⃣ Deleting tax settings...')
    const deletedTaxSettings = await prisma.taxSettings.deleteMany({})
    console.log(`   ✅ Deleted ${deletedTaxSettings.count} tax settings`)
    

    
    // Step 13: Delete Audit Logs
    console.log('1️⃣3️⃣ Deleting audit logs...')
    const deletedAuditLogs = await prisma.auditLog.deleteMany({})
    console.log(`   ✅ Deleted ${deletedAuditLogs.count} audit logs`)
    
    // Step 14: Clean up Sessions and Accounts for deleted users
    console.log('1️⃣4️⃣ Cleaning up orphaned sessions and accounts...')
    
    // Get remaining user IDs (should only be admin)
    const remainingUsers = await prisma.user.findMany({
      select: { id: true }
    })
    const remainingUserIds = remainingUsers.map(u => u.id)
    
    // Delete sessions for deleted users
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        userId: {
          notIn: remainingUserIds
        }
      }
    })
    console.log(`   ✅ Deleted ${deletedSessions.count} orphaned sessions`)
    
    // Delete accounts for deleted users
    const deletedAccounts = await prisma.account.deleteMany({
      where: {
        userId: {
          notIn: remainingUserIds
        }
      }
    })
    console.log(`   ✅ Deleted ${deletedAccounts.count} orphaned accounts`)
    
    console.log('\n🎉 Database cleanup completed successfully!')
    console.log('\n📊 Cleanup Summary:')
    console.log(`   • Quote Items: ${deletedQuoteItems.count}`)
    console.log(`   • Quote Shares: ${deletedQuoteShares.count}`)
    console.log(`   • Quotes: ${deletedQuotes.count}`)
    console.log(`   • Product Pricing: ${deletedProductPricing.count}`)
    console.log(`   • Products: ${deletedProducts.count}`)
    console.log(`   • Categories: ${deletedChildCategories.count + deletedParentCategories.count}`)
    console.log(`   • Materials: ${deletedMaterials.count}`)
    console.log(`   • Hardware: ${deletedHardware.count}`)
    console.log(`   • Users: ${deletedUsers.count}`)
    console.log(`   • Company Settings: ${deletedCompanySettings.count}`)
    console.log(`   • Tax Settings: ${deletedTaxSettings.count}`)

    console.log(`   • Audit Logs: ${deletedAuditLogs.count}`)
    console.log(`   • Orphaned Sessions: ${deletedSessions.count}`)
    console.log(`   • Orphaned Accounts: ${deletedAccounts.count}`)
    
    // Show what remains
    const remainingUsersCount = await prisma.user.count()
    console.log(`\n✅ Remaining data:`)
    console.log(`   • Users: ${remainingUsersCount} (admin only)`)
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Execute cleanup
cleanupDatabase()
  .catch((error) => {
    console.error('❌ Cleanup failed:', error)
    process.exit(1)
  })
