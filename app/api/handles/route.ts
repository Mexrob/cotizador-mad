import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
        const handles = await prisma.handleModel.findMany({
            where: {
                isActive: true,
            },
            orderBy: {
                sortOrder: 'asc',
            },
        })

        return NextResponse.json({
            success: true,
            data: handles,
        })
    } catch (error) {
        console.error('Error fetching handles:', error)
        return NextResponse.json(
            { success: false, error: 'Error fetching handles' },
            { status: 500 }
        )
    }
}
