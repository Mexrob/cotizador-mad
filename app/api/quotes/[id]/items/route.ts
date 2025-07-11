
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Add new item to quote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { productId, quantity = 1, customDimensions, customWidth, customHeight, customDepth } = body
    
    // Handle both old format (customWidth/customHeight) and new format (customDimensions)
    const width = customDimensions?.width || customWidth
    const height = customDimensions?.height || customHeight
    const depth = customDimensions?.depth || customDepth

    // Check if quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Get product and its pricing
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        pricing: {
          where: { userRole: session.user.role as any },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Get the base price for user's role
    let basePrice = 0
    if (product.pricing && product.pricing.length > 0) {
      basePrice = product.pricing[0].finalPrice
    } else {
      // Fallback to a default pricing if no role-specific pricing exists
      const defaultPricing = await prisma.productPricing.findFirst({
        where: { productId, userRole: 'RETAIL' as any },
      })
      basePrice = defaultPricing?.finalPrice || product.basePrice || 0
    }

    // Calculate unit price based on custom dimensions for customizable products
    let unitPrice = 0
    if (product.isCustomizable && width && height && product.width && product.height) {
      // Standard product dimensions in m²
      const standardArea = (product.width / 1000) * (product.height / 1000)
      
      // Custom dimensions area in m²
      const customArea = (width / 1000) * (height / 1000)
      
      // Price per m² based on standard dimensions
      const pricePerSquareMeter = standardArea > 0 ? basePrice / standardArea : 0
      
      // Calculate price for custom dimensions
      unitPrice = customArea * pricePerSquareMeter
    } else {
      // For non-customizable products, use the base price as-is
      unitPrice = basePrice
    }

    const totalPrice = unitPrice * quantity

    // Create quote item
    const quoteItem = await prisma.quoteItem.create({
      data: {
        quoteId: params.id,
        productId,
        quantity,
        customWidth: width,
        customHeight: height,
        customDepth: depth,
        unitPrice,
        totalPrice,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    })

    // Recalculate quote totals
    await recalculateQuoteTotals(params.id)

    return NextResponse.json({
      success: true,
      data: quoteItem,
      message: 'Producto agregado a la cotización',
    })
  } catch (error) {
    console.error('Add quote item error:', error)
    return NextResponse.json(
      { error: 'Error al agregar producto' },
      { status: 500 }
    )
  }
}

async function recalculateQuoteTotals(quoteId: string) {
  // Get all quote items
  const items = await prisma.quoteItem.findMany({
    where: { quoteId },
  })

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxAmount = subtotal * 0.16 // 16% IVA
  
  // Keep existing discount amount
  const currentQuote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { discountAmount: true },
  })
  
  const discountAmount = currentQuote?.discountAmount || 0
  const totalAmount = subtotal + taxAmount - discountAmount

  // Update quote totals
  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotal,
      taxAmount,
      totalAmount,
    },
  })
}
