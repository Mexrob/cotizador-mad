
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'
import { generateQuoteNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }


    // Get the original quote
    const originalQuote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    })

    if (!originalQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Check permissions: Admin can duplicate any quote. Non-admin can only duplicate their own quotes.
    const isAdmin = adminAuthGuard(session) == null; // It returns null if admin, so this is true for admin
    if (!isAdmin && originalQuote.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Create the duplicate quote
    const duplicateQuote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        userId: session.user.id,
        status: 'PENDING', // Always start as pending
        customerName: originalQuote.customerName,
        customerEmail: originalQuote.customerEmail,
        customerPhone: originalQuote.customerPhone,
        customerAddress: originalQuote.customerAddress,
        projectName: `${originalQuote.projectName} (Copia)`,
        projectAddress: originalQuote.projectAddress,
        roomDimensions: originalQuote.roomDimensions as any,
        subtotal: originalQuote.subtotal,
        taxAmount: originalQuote.taxAmount,
        discountAmount: 0, // Reset discount
        totalAmount: originalQuote.subtotal + originalQuote.taxAmount,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        deliveryDate: null, // Reset delivery date
        notes: originalQuote.notes,
        attachments: [], // Reset attachments
        design3d: originalQuote.design3d as any,
        floorPlan: originalQuote.floorPlan,
        items: {
          create: originalQuote.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            customWidth: item.customWidth,
            customHeight: item.customHeight,
            customDepth: item.customDepth,
            doorTypeId: item.doorTypeId,
            doorModelId: item.doorModelId,
            colorToneId: item.colorToneId,
            woodGrainId: item.woodGrainId,
            handleId: item.handleId,
            isTwoSided: item.isTwoSided,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: duplicateQuote,
      message: 'Cotización duplicada exitosamente',
    })
  } catch (error) {
    console.error('Quote duplication error:', error)
    return NextResponse.json(
      { error: 'Error al duplicar cotización' },
      { status: 500 }
    )
  }
}
