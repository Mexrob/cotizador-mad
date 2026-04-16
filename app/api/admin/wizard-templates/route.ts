import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Schema de validación para wizard template
const wizardTemplateSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  stepsConfig: z.array(z.object({
    id: z.string(),
    stepDefinitionCode: z.string(),
    order: z.number(),
    isRequired: z.boolean(),
    isEnabled: z.boolean(),
    config: z.record(z.unknown()),
    conditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'notEquals', 'in', 'notIn', 'exists', 'gt', 'lt']),
      value: z.unknown(),
    })).optional(),
    skipConditions: z.array(z.object({
      field: z.string(),
      operator: z.enum(['equals', 'notEquals', 'in', 'notIn', 'exists', 'gt', 'lt']),
      value: z.unknown(),
    })).optional(),
  })),
  pricingConfig: z.unknown().optional(),
  validationRules: z.unknown().optional(),
  uiConfig: z.unknown().optional(),
})

// GET - Listar todos los templates
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const templates = await prisma.wizardTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error('Error fetching wizard templates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo template
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
    const validatedData = wizardTemplateSchema.parse(body)

    // Verificar que el código no exista
    const existing = await prisma.wizardTemplate.findUnique({
      where: { code: validatedData.code },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El código ya existe' },
        { status: 400 }
      )
    }

    // Si es default, quitar default de otros
    if (validatedData.isDefault) {
      await prisma.wizardTemplate.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    const template = await prisma.wizardTemplate.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        description: validatedData.description,
        isActive: validatedData.isActive,
        isDefault: validatedData.isDefault,
        stepsConfig: validatedData.stepsConfig as any,
        pricingConfig: validatedData.pricingConfig as any,
        validationRules: validatedData.validationRules as any,
        uiConfig: validatedData.uiConfig as any,
      },
    })

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error) {
    console.error('Error creating wizard template:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
