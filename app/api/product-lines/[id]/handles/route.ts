import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const handles = await prisma.handleModel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ success: true, data: handles })
  } catch (error) {
    console.error('Error fetching handles by line:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch handles' },
      { status: 500 }
    )
  }
}
