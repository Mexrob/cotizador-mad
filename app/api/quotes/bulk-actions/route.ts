
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, quoteIds } = body

    if (!action || !quoteIds || !Array.isArray(quoteIds) || quoteIds.length === 0) {
      return NextResponse.json(
        { error: 'Acción y IDs de cotizaciones son requeridos' },
        { status: 400 }
      )
    }

    // Build where clause with permission check
    const where: any = {
      id: { in: quoteIds },
    }

    // Regular users can only modify their own quotes
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id
    }

    let result
    let message = ''

    switch (action) {
      case 'delete':
        result = await prisma.quote.deleteMany({ where })
        message = `${result.count} cotizaciones eliminadas exitosamente`
        break

      case 'change_status':
        // Only admins can change quote status
        if (session.user.role !== 'ADMIN') {
          return NextResponse.json(
            { error: 'Solo los administradores pueden cambiar el estado de las cotizaciones' },
            { status: 403 }
          )
        }
        
        const { status } = body
        if (!status) {
          return NextResponse.json(
            { error: 'Estado es requerido para cambio de estado' },
            { status: 400 }
          )
        }
        result = await prisma.quote.updateMany({
          where,
          data: { status },
        })
        message = `${result.count} cotizaciones actualizadas a estado ${status}`
        break

      case 'export':
        // Get quotes for export
        const quotes = await prisma.quote.findMany({
          where,
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        })
        
        return NextResponse.json({
          success: true,
          data: quotes,
          message: `${quotes.length} cotizaciones preparadas para exportación`,
        })

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      message,
    })
  } catch (error) {
    console.error('Bulk action error:', error)
    return NextResponse.json(
      { error: 'Error al ejecutar acción en lote' },
      { status: 500 }
    )
  }
}
