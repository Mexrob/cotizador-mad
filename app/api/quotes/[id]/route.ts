
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'

export const dynamic = 'force-dynamic'

export async function GET(
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

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            companyName: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                materials: true,
                pricing: true,
              },
            },
            productLine: true,
            productTone: true,
            handleModel: true,
            woodGrain: true,
          },
        },
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Check if user has access to this quote
    if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: quote,
    })
  } catch (error) {
    console.error('Quote fetch error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotización' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      projectName,
      projectAddress,
      roomDimensions,
      notes,
      deliveryDate,
      discountAmount,
    } = body

    // Get current quote to check ownership
    const currentQuote = await prisma.quote.findUnique({
      where: { id: params.id },
    })

    if (!currentQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Check permissions: Admin can modify any quote. Non-admin can only modify their own quotes.
    const isAdmin = adminAuthGuard(session) == null;
    if (!isAdmin && currentQuote.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Calculate new totals if discount is applied
    let updateData: any = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      projectName,
      projectAddress,
      roomDimensions,
      notes,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
    }

    // Only admins can change quote status
    if (status) {
      const authGuardResponse = adminAuthGuard(session);
      if (authGuardResponse) return authGuardResponse;
      updateData.status = status
    }

    if (discountAmount !== undefined) {
      const newTotalAmount = currentQuote.subtotal + currentQuote.taxAmount - discountAmount
      updateData.discountAmount = discountAmount
      updateData.totalAmount = newTotalAmount
    }

    const quote = await prisma.quote.update({
      where: { id: params.id },
      data: updateData,
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
      data: quote,
      message: 'Cotización actualizada exitosamente',
    })
  } catch (error) {
    console.error('Quote update error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cotización' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Get current quote to check ownership
    const currentQuote = await prisma.quote.findUnique({
      where: { id: params.id },
    })

    if (!currentQuote) {
      return NextResponse.json({ error: 'Cotización no encontrada' }, { status: 404 })
    }

    // Check permissions
    // Admin can delete any quote. Non-admin can only delete their own quotes.
    const isAdmin = adminAuthGuard(session) == null;
    if (!isAdmin && currentQuote.userId !== session.user.id) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Delete quote and related items (cascade)
    await prisma.quote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Cotización eliminada exitosamente',
    })
  } catch (error) {
    console.error('Quote deletion error:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cotización' },
      { status: 500 }
    )
  }
}
