import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'

export const dynamic = 'force-dynamic'

// Add new item to quote
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    console.log('Cuerpo de la solicitud recibido:', body)
    const {
      productId,
      quantity = 1,
      customDimensions,
      customWidth,
      customHeight,
      customDepth,
      doorTypeId,
      doorModelId,
      colorToneId,
      woodGrainId,
      handleId,
      isTwoSided,
    } = body
    
    // Handle both old format (customWidth/customHeight) and new format (customDimensions)
    const width = customDimensions?.width || customWidth
    const height = customDimensions?.height || customHeight
    const depth = customDimensions?.depth || customDepth

    // Check if quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Check permissions: Admin can modify any quote items. Non-admin can only modify items in their own quotes.
    const isAdmin = adminAuthGuard(session) == null;
    if (!isAdmin && quote.userId !== session.user.id) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Get product and its pricing
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        pricing: {
          where: { userRole: session.user.role as any },
        },
        // Removed direct includes for doorType, doorModel, colorTone, woodGrain, handle
        // as these are relations of QuoteItem, not Product directly.
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Validate tiempo de entrega - prevent mixing different delivery times
    const existingItems = await prisma.quoteItem.findMany({
      where: { quoteId: params.id },
      include: { product: { select: { tiempoEntrega: true } } }
    })
    const existingTiempoEntrega = existingItems[0]?.product?.tiempoEntrega
    if (existingItems.length > 0 && existingTiempoEntrega !== product.tiempoEntrega) {
      return NextResponse.json(
        { error: `Error en el tiempo de entrega. Esta cotización tiene productos con ${existingTiempoEntrega} días. Solo puedes agregar productos con el mismo tiempo de entrega.` },
        { status: 400 }
      )
    }

    // Get the base price for user's role
    let basePrice = 0
    // Explicitly cast product to any to bypass TypeScript error for pricing
    if ((product as any).pricing && (product as any).pricing.length > 0) {
      basePrice = (product as any).pricing[0].finalPrice
    } else {
      // Fallback to a default pricing if no role-specific pricing exists
      const defaultPricing = await prisma.productPricing.findFirst({
        where: { productId, userRole: 'RETAIL' as any },
      })
      basePrice = defaultPricing?.finalPrice || (product as any).precioBaseM2 || 0
    }

    // Calculate unit price based on custom dimensions for customizable products
    let unitPrice = 0
    if (width && height) {
      // Calculate price based on area and price per m²
      const area = (width / 1000) * (height / 1000)
      unitPrice = area * basePrice
    } else {
      // For non-customizable products, use the base price as-is
      unitPrice = basePrice
      console.log('Precio unitario calculado:', unitPrice)
    }

    // Get handle cost if a handle is selected
    let handleCost = 0;
    if (handleId) {
      const handle = await prisma.handle.findUnique({
        where: { id: handleId },
        select: { cost: true },
      });
      handleCost = handle?.cost || 0;
    }

    // Calculate packaging cost (assuming a rate per mm²)
    const packagingRatePerMm2 = 0.00001; // Example rate, adjust as needed
    const packagingCost = (width || 0) * (height || 0) * packagingRatePerMm2;

    const totalPrice = (unitPrice * quantity) + handleCost + packagingCost;

    // Create quote item
    const quoteItem = await prisma.quoteItem.create({
      data: {
        quoteId: params.id,
        productId,
        quantity,
        customWidth: width,
        customHeight: height,
        customDepth: depth,
        doorTypeId,
        doorModelId,
        colorToneId,
        woodGrainId,
        handleId,
        isTwoSided,
        unitPrice,
        totalPrice,
        packagingCost,
      } as any, // Cast to any to bypass type checking for now
      include: {
        product: true,
        doorType: { select: { id: true, name: true } },
        doorModel: { select: { id: true, name: true } },
        colorTone: { select: { id: true, name: true } },
        woodGrain: { select: { id: true, name: true } },
        handle: { select: { id: true, name: true, cost: true } },
      },
    })

    // Recalculate quote totals
    await recalculateQuoteTotals(params.id)
    console.log('Totales de la cotización recalculados')

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
