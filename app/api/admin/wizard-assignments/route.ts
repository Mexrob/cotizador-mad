import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'
import { UserRole } from '@prisma/client'

const assignmentSchema = z.object({
  templateId: z.string(),
  userId: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  priority: z.number().default(0),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
})

// GET - Listar asignaciones
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    const where = templateId ? { templateId } : {}

    const assignments = await prisma.wizardAssignment.findMany({
      where,
      include: {
        template: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: assignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST - Crear asignación
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = assignmentSchema.parse(body)

    const assignment = await prisma.wizardAssignment.create({
      data: {
        templateId: validatedData.templateId,
        userId: validatedData.userId,
        role: validatedData.role,
        priority: validatedData.priority,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : null,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
      },
    })

    return NextResponse.json({ success: true, data: assignment })
  } catch (error) {
    console.error('Error creating assignment:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar asignaciones por templateId
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId is required' },
        { status: 400 }
      )
    }

    await prisma.wizardAssignment.deleteMany({
      where: { templateId },
    })

    return NextResponse.json({ success: true, data: { deleted: true } })
  } catch (error) {
    console.error('Error deleting assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete assignments' },
      { status: 500 }
    )
  }
}
