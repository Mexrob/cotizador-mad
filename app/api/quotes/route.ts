
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateQuoteNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean)
    const customerName = searchParams.get('customerName')
    const projectName = searchParams.get('projectName')
    const quoteNumber = searchParams.get('quoteNumber')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    // Regular users can only see their own quotes
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id
    }

    // Status filtering - support both single status and multiple statuses
    if (statuses && statuses.length > 0) {
      where.status = { in: statuses }
    } else if (status) {
      where.status = status
    }

    // Text search across multiple fields
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
        { projectName: { contains: search, mode: 'insensitive' } },
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Specific field searches
    if (customerName) {
      where.customerName = { contains: customerName, mode: 'insensitive' }
    }
    if (projectName) {
      where.projectName = { contains: projectName, mode: 'insensitive' }
    }
    if (quoteNumber) {
      where.quoteNumber = { contains: quoteNumber, mode: 'insensitive' }
    }

    // Amount range filtering
    if (minAmount || maxAmount) {
      where.totalAmount = {}
      if (minAmount) where.totalAmount.gte = parseFloat(minAmount)
      if (maxAmount) where.totalAmount.lte = parseFloat(maxAmount)
    }

    // Date range filtering
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Sort options
    const orderBy: any = {}
    switch (sortBy) {
      case 'customerName':
        orderBy.customerName = sortOrder
        break
      case 'projectName':
        orderBy.projectName = sortOrder
        break
      case 'totalAmount':
        orderBy.totalAmount = sortOrder
        break
      case 'status':
        orderBy.status = sortOrder
        break
      case 'validUntil':
        orderBy.validUntil = sortOrder
        break
      default:
        orderBy.createdAt = sortOrder
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  thumbnail: true,
                  sku: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.quote.count({ where }),
    ])

    // Get summary statistics
    const summaryStats = await prisma.quote.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
      _avg: {
        totalAmount: true,
      },
      _count: {
        _all: true,
      },
    })

    // Get status counts
    const statusCounts = await prisma.quote.groupBy({
      by: ['status'],
      where: session.user.role !== 'ADMIN' ? { userId: session.user.id } : {},
      _count: {
        _all: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalValue: summaryStats._sum.totalAmount || 0,
        averageValue: summaryStats._avg.totalAmount || 0,
        totalCount: summaryStats._count._all,
      },
      statusCounts: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = curr._count._all
        return acc
      }, {} as Record<string, number>),
    })
  } catch (error) {
    console.error('Quotes fetch error:', error)
    return NextResponse.json(
      { error: 'Error al obtener cotizaciones' },
      { status: 500 }
    )
  }
}

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
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      projectName,
      projectAddress,
      roomDimensions,
      items,
      notes,
      deliveryDate,
    } = body

    // Calculate totals
    let subtotal = 0
    const validItems = items.map((item: any) => {
      const itemTotal = item.unitPrice * item.quantity
      subtotal += itemTotal
      return {
        ...item,
        totalPrice: itemTotal,
      }
    })

    const taxAmount = subtotal * 0.16 // 16% IVA
    const totalAmount = subtotal + taxAmount

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        userId: session.user.id,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        projectName,
        projectAddress,
        roomDimensions,
        subtotal,
        taxAmount,
        totalAmount,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        notes,
        items: {
          create: validItems,
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
      data: quote,
      message: 'Cotización creada exitosamente',
    })
  } catch (error) {
    console.error('Quote creation error:', error)
    return NextResponse.json(
      { error: 'Error al crear cotización' },
      { status: 500 }
    )
  }
}
