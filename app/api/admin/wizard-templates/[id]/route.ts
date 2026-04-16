import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  stepsConfig: z.array(z.object({
    id: z.string(),
    stepDefinitionCode: z.string(),
    order: z.number(),
    isRequired: z.boolean(),
    isEnabled: z.boolean(),
    config: z.record(z.unknown()),
  })).optional(),
  pricingConfig: z.unknown().optional(),
  validationRules: z.unknown().optional(),
  uiConfig: z.unknown().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
})

// PUT - Actualizar template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    // Si es default, quitar default de otros
    if (validatedData.isDefault) {
      await prisma.wizardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const updateData: any = {}
    if (validatedData.name) updateData.name = validatedData.name
    if (validatedData.description !== undefined) updateData.description = validatedData.description
    if (validatedData.stepsConfig) updateData.stepsConfig = validatedData.stepsConfig
    if (validatedData.pricingConfig) updateData.pricingConfig = validatedData.pricingConfig
    if (validatedData.validationRules) updateData.validationRules = validatedData.validationRules
    if (validatedData.uiConfig) updateData.uiConfig = validatedData.uiConfig
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isDefault !== undefined) updateData.isDefault = validatedData.isDefault

    const template = await prisma.wizardTemplate.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: template })
  } catch (error) {
    console.error('Error updating wizard template:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    await prisma.wizardTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting wizard template:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}
