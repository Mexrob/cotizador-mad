import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-static'
export const revalidate = 60 // Cache por 60 segundos

export async function GET() {
  try {
    const backFaces = await prisma.productBackFace.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceAdjustment: true,
        isTwoSided: true,
        sortOrder: true,
      },
    })

    return NextResponse.json({ success: true, data: backFaces })
  } catch (error) {
    console.error('Error fetching back faces:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch back faces' },
      { status: 500 }
    )
  }
}
