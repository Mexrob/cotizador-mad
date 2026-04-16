import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false
            },
            data: { isRead: true }
        })

        return NextResponse.json({
            success: true,
            message: 'Todas las notificaciones marcadas como leídas'
        })
    } catch (error) {
        console.error('Error updating notifications:', error)
        return NextResponse.json(
            { error: 'Error al actualizar notificaciones' },
            { status: 500 }
        )
    }
}
