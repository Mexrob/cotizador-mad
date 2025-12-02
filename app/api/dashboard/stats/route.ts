
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  console.log('Attempting to fetch session...'); // Added log
  try {
    const session = await getServerSession(authOptions)

    console.log('Session fetched:', session ? 'Successful' : 'Failed to retrieve session'); // Added log

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Log the session user for debugging
    console.log('Session user:', session.user)

    const userId = session.user.role === 'ADMIN' ? undefined : session.user.id

    console.log('Determined userId:', userId); // Added log
    console.log('Session user role:', session.user.role); // Added log

    // Date ranges
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    console.log('Current date:', now)
    console.log('Start of month:', startOfMonth)

    // Build where clauses
    const whereBase: any = userId ? { userId } : {}
    const whereMonth = { ...whereBase, createdAt: { gte: startOfMonth } }

    console.log('whereMonth filter:', JSON.stringify(whereMonth, null, 2))

    // Get statistics
    const [
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      monthlyQuotes,
      totalRevenue,
      monthlyRevenue,
      recentQuotes,
    ] = await Promise.all([
      // Total quotes
      prisma.quote.count({ where: whereBase }),

      // Pending quotes
      prisma.quote.count({
        where: { ...whereBase, status: 'PENDING' }
      }),

      // Approved quotes
      prisma.quote.count({
        where: { ...whereBase, status: 'APPROVED' }
      }),

      // Monthly quotes
      prisma.quote.count({ where: whereMonth }),

      // Total revenue (from all quotes)
      prisma.quote.aggregate({
        where: whereBase,
        _sum: { totalAmount: true },
      }),

      // Monthly revenue
      prisma.quote.aggregate({
        where: whereMonth,
        _sum: { totalAmount: true },
      }),

      // Recent quotes
      prisma.quote.findMany({
        where: whereBase,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
    ])

    console.log('Monthly quotes count:', monthlyQuotes)
    console.log('Monthly revenue result:', monthlyRevenue)

    // Get top products (only for admin)
    let topProducts: Array<{
      product: any
      quantity: number
      revenue: number
    }> = []

    if (session.user.role === 'ADMIN') {
      const productStats = await prisma.quoteItem.groupBy({
        by: ['productId'],
        _sum: {
          quantity: true,
          totalPrice: true,
        },
        orderBy: {
          _sum: {
            totalPrice: 'desc',
          },
        },
        take: 5,
      })

      const productIds = productStats.map(stat => stat.productId)
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          name: true,
          thumbnail: true,
          sku: true,
        },
      })

      topProducts = productStats.map(stat => {
        const product = products.find(p => p.id === stat.productId)
        return {
          product,
          quantity: stat._sum.quantity || 0,
          revenue: stat._sum.totalPrice || 0,
        }
      })
    }

    const stats = {
      totalQuotes,
      pendingQuotes,
      approvedQuotes,
      monthlyQuotes,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      topProducts,
      recentQuotes,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
