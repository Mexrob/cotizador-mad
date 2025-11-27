import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
        const lines = await prisma.productLine.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        })

        return NextResponse.json({
            success: true,
            data: lines,
        })
    } catch (error) {
        console.error('Error fetching product lines:', error)
        return NextResponse.json(
            { success: false, error: 'Error fetching product lines' },
            { status: 500 }
        )
    }
}
