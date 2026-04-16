import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-static'
export const revalidate = 60 // Cache por 60 segundos

export async function GET() {
  try {
    const tones = await prisma.productTone.findMany({
      where: { isActive: true },
      include: { line: true },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ success: true, data: tones })
  } catch (error) {
    console.error('Error fetching product tones:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tones' },
      { status: 500 }
    )
  }
}
