import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-static'
export const revalidate = 60 // Cache por 60 segundos

export async function GET() {
  try {
    const edgeBandings = await prisma.edgeBanding.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ success: true, data: edgeBandings })
  } catch (error) {
    console.error('Error fetching edge bandings:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch edge bandings' },
      { status: 500 }
    )
  }
}
