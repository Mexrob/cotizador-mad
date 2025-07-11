
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  console.log('🔍 Checking current database data...\n')
  
  try {
    // Check users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        status: true
      }
    })
    console.log(`👥 Users: ${users.length}`)
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.role}) - ${user.name}`)
    })
    
    // Check quotes
    const quotes = await prisma.quote.findMany({
      select: {
        id: true,
        quoteNumber: true,
        status: true,
        customerName: true,
        projectName: true,
        _count: {
          select: { items: true }
        }
      }
    })
    console.log(`\n📋 Quotes: ${quotes.length}`)
    quotes.forEach(quote => {
      console.log(`  - ${quote.quoteNumber} (${quote.status}) - ${quote.customerName} - ${quote._count.items} items`)
    })
    
    // Check products
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        category: {
          select: { name: true }
        }
      }
    })
    console.log(`\n📦 Products: ${products.length}`)
    products.forEach(product => {
      console.log(`  - ${product.sku}: ${product.name} (${product.category.name}) - ${product.status}`)
    })
    
    // Check categories
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        _count: {
          select: { products: true }
        }
      }
    })
    console.log(`\n📂 Categories: ${categories.length}`)
    categories.forEach(category => {
      console.log(`  - ${category.name} (${category.status}) - ${category._count.products} products`)
    })
    
    // Check materials
    const materials = await prisma.material.findMany({
      select: {
        id: true,
        name: true,
        status: true
      }
    })
    console.log(`\n🎨 Materials: ${materials.length}`)
    materials.forEach(material => {
      console.log(`  - ${material.name} (${material.status})`)
    })
    
    // Check hardware
    const hardware = await prisma.hardware.findMany({
      select: {
        id: true,
        name: true,
        type: true,
        status: true
      }
    })
    console.log(`\n🔧 Hardware: ${hardware.length}`)
    hardware.forEach(hw => {
      console.log(`  - ${hw.name} (${hw.type}) - ${hw.status}`)
    })
    
    // Check company settings
    const companySettings = await prisma.companySettings.findMany({
      select: {
        id: true,
        companyName: true,
        email: true
      }
    })
    console.log(`\n🏢 Company Settings: ${companySettings.length}`)
    companySettings.forEach(company => {
      console.log(`  - ${company.companyName} (${company.email})`)
    })
    

    
    // Check audit logs
    const auditLogs = await prisma.auditLog.count()
    console.log(`\n📝 Audit Logs: ${auditLogs}`)
    
  } catch (error) {
    console.error('❌ Error checking data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
