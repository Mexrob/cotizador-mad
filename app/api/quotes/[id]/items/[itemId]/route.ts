
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// Update quote item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
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
    const { quantity, customWidth, customHeight, customDepth } = body

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

    // Get current quote item
    const currentItem = await prisma.quoteItem.findUnique({
      where: { id: params.itemId },
    })

    if (!currentItem || currentItem.quoteId !== params.id) {
      return NextResponse.json(
        { error: 'Elemento no encontrado' },
        { status: 404 }
      )
    }

    // Calculate new total price
    const totalPrice = currentItem.unitPrice * (quantity || currentItem.quantity)

    // Update quote item
    const updatedItem = await prisma.quoteItem.update({
      where: { id: params.itemId },
      data: {
        quantity: quantity || currentItem.quantity,
        customWidth,
        customHeight,
        customDepth,
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
      data: updatedItem,
      message: 'Elemento actualizado exitosamente',
    })
  } catch (error) {
    console.error('Update quote item error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar elemento' },
      { status: 500 }
    )
  }
}

// Delete quote item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

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

    // Check if item belongs to this quote
    const quoteItem = await prisma.quoteItem.findUnique({
      where: { id: params.itemId },
    })

    if (!quoteItem || quoteItem.quoteId !== params.id) {
      return NextResponse.json(
        { error: 'Elemento no encontrado' },
        { status: 404 }
      )
    }

    // Delete quote item
    await prisma.quoteItem.delete({
      where: { id: params.itemId },
    })

    // Recalculate quote totals
    await recalculateQuoteTotals(params.id)

    return NextResponse.json({
      success: true,
      message: 'Elemento eliminado exitosamente',
    })
  } catch (error) {
    console.error('Delete quote item error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar elemento' },
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
