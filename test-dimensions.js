
require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDimensions() {
  try {
    console.log('🔍 Verificando cotizaciones con dimensiones personalizadas...\n')
    
    const quotes = await prisma.quote.findMany({
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                width: true,
                height: true,
                isCustomizable: true
              }
            }
          }
        }
      }
    })
    
    quotes.forEach((quote, index) => {
      console.log(`📋 Cotización ${index + 1}: ${quote.quoteNumber}`)
      console.log(`   Cliente: ${quote.customerName}`)
      console.log(`   Proyecto: ${quote.projectName}`)
      console.log(`   ID: ${quote.id}`)
      console.log(`   Productos (${quote.items.length}):`)
      
      quote.items.forEach((item, itemIndex) => {
        const product = item.product
        const customArea = item.customWidth && item.customHeight 
          ? (item.customWidth / 1000) * (item.customHeight / 1000)
          : null
        
        console.log(`     ${itemIndex + 1}. ${product.name} (${product.sku})`)
        console.log(`        Cantidad: ${item.quantity}`)
        console.log(`        Dimensiones estándar: ${product.width}mm × ${product.height}mm`)
        
        if (item.customWidth && item.customHeight) {
          console.log(`        ✅ Dimensiones personalizadas: ${item.customWidth}mm × ${item.customHeight}mm`)
          console.log(`        ✅ Área calculada: ${customArea?.toFixed(4)} m²`)
          console.log(`        Precio unitario: $${item.unitPrice.toFixed(2)}`)
          if (customArea && product.isCustomizable) {
            console.log(`        Precio por m²: $${(item.unitPrice / customArea).toFixed(2)}/m²`)
          }
        } else {
          console.log(`        ❌ Sin dimensiones personalizadas`)
        }
        console.log('')
      })
      console.log('')
    })
    
    console.log('✅ Verificación completada')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDimensions()
