
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const authGuardResponse = adminAuthGuard(session)
    if (authGuardResponse) return authGuardResponse

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Estado es requerido' }, { status: 400 })
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'INACTIVE', 'PENDING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
    }

    // Prevent changing own status
    if (session.user.id === params.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio estado' },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user status:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
