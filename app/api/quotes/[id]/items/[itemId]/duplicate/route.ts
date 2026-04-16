
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Check if quote exists and user has access
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      select: { id: true, userId: true, discountAmount: true }
    })

    if (!quote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    const isAdmin = adminAuthGuard(session) == null;
    if (!isAdmin && quote.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Get the item to duplicate
    const originalItem = await prisma.quoteItem.findUnique({
      where: { id: params.itemId }
    })

    if (!originalItem || originalItem.quoteId !== params.id) {
      return NextResponse.json({ error: 'Partida no encontrada' }, { status: 404 })
    }

    // Clone the item data, removing ID and timestamps
    const { id, createdAt, updatedAt, ...cloneData } = originalItem;

    // Create the duplicated item
    const newItem = await prisma.quoteItem.create({
      // @ts-ignore
      data: {
        ...cloneData,
        // Ensure it's linked to the correct quote (though it should be already in cloneData)
        quoteId: params.id 
      },
      include: {
        product: true,
        productLine: true,
        productTone: true,
        handleModel: true,
      }
    })

    // Recalculate quote totals
    await recalculateQuoteTotals(params.id)

    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Partida duplicada exitosamente'
    })

  } catch (error: any) {
    console.error('Duplicate item error:', error)
    return NextResponse.json(
      { error: `Error al duplicar partida: ${error.message}` },
      { status: 500 }
    )
  }
}

async function recalculateQuoteTotals(quoteId: string) {
  const items = await prisma.quoteItem.findMany({
    where: { quoteId },
  })

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)
  const taxAmount = subtotal * 0.16 // 16% IVA

  const currentQuote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { discountAmount: true },
  })

  const discountAmount = currentQuote?.discountAmount || 0
  const totalAmount = subtotal + taxAmount - discountAmount

  await prisma.quote.update({
    where: { id: quoteId },
    data: {
      subtotal,
      taxAmount,
      totalAmount,
    },
  })
}
