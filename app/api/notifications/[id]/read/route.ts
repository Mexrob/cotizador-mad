import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const notification = await prisma.notification.findUnique({
            where: { id: params.id }
        })

        if (!notification) {
            return NextResponse.json({ error: 'Notificación no encontrada' }, { status: 404 })
        }

        if (notification.userId !== session.user.id) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        await prisma.notification.update({
            where: { id: params.id },
            data: { isRead: true }
        })

        return NextResponse.json({
            success: true,
            message: 'Notificación marcada como leída'
        })
    } catch (error) {
        console.error('Error updating notification:', error)
        return NextResponse.json(
            { error: 'Error al actualizar notificación' },
            { status: 500 }
        )
    }
}
