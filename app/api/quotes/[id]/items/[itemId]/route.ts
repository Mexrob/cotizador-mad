
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'

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

    const isAdmin = adminAuthGuard(session) == null;
    if (!isAdmin && quote.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
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

    console.log('Update payload:', {
      itemId: params.itemId,
      quantity,
      customWidth,
      customHeight,
      lineId: body.lineId,
      toneId: body.toneId,
      handleId: body.handleId,
      cars: body.cars
    })

    // Update quote item
    const updatedItem = await prisma.quoteItem.update({
      where: { id: params.itemId },
      data: {
        quantity: quantity || currentItem.quantity,
        customWidth,
        customHeight,
        customDepth,
        productLineId: body.lineId,
        productToneId: body.toneId,
        handleModelId: body.handleId,
        isTwoSided: body.cars === 2,
        totalPrice,
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
        productLine: true,
        productTone: true,
        handleModel: true,
      },
    })

    console.log('Item updated successfully')

    // Recalculate quote totals
    await recalculateQuoteTotals(params.id)

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Elemento actualizado exitosamente',
    })
  } catch (error) {
    console.error('Update quote item error:', error)
    // @ts-ignore
    console.error('Error details:', error?.message || error)
    return NextResponse.json(
      { error: `Error al actualizar elemento: ${(error as Error).message}` },
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

    const isAdmin = adminAuthGuard(session) == null;
    if (!isAdmin && quote.userId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
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
