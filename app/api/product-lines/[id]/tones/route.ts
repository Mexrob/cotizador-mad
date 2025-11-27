import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const tones = await prisma.productTone.findMany({
            where: {
                lineId: params.id,
                isActive: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        })

        return NextResponse.json({
            success: true,
            data: tones,
        })
    } catch (error) {
        console.error('Error fetching product tones:', error)
        return NextResponse.json(
            { success: false, error: 'Error fetching product tones' },
            { status: 500 }
        )
    }
}
