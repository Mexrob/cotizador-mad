import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const notifications = await prisma.notification.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        })

        return NextResponse.json({
            success: true,
            data: notifications
        })
    } catch (error) {
        console.error('Error fetching notifications:', error)
        return NextResponse.json(
            { error: 'Error al obtener notificaciones' },
            { status: 500 }
        )
    }
}
