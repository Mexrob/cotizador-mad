import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const wizardStepDefinitionSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  code: z.string().min(1, 'El código es requerido'),
  componentName: z.string().min(1, 'El nombre del componente es requerido'),
  componentPath: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  isSystem: z.boolean().default(false),
  configSchema: z.unknown().optional(),
  defaultConfig: z.unknown().optional(),
  stepType: z.enum(['STANDARD', 'CUSTOM', 'CONDITIONAL', 'CALCULATION']).default('STANDARD'),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const steps = await prisma.wizardStepDefinition.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: steps,
    })
  } catch (error) {
    console.error('Error fetching wizard step definitions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch step definitions' },
      { status: 500 }
    )
  }
}

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
    const validatedData = wizardStepDefinitionSchema.parse(body)

    const existing = await prisma.wizardStepDefinition.findUnique({
      where: { code: validatedData.code },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'El código ya existe' },
        { status: 400 }
      )
    }

    const step = await prisma.wizardStepDefinition.create({
      data: {
        name: validatedData.name,
        code: validatedData.code,
        componentName: validatedData.componentName,
        componentPath: validatedData.componentPath || '',
        description: validatedData.description,
        icon: validatedData.icon,
        isSystem: validatedData.isSystem,
        configSchema: validatedData.configSchema as any,
        defaultConfig: validatedData.defaultConfig as any,
        stepType: validatedData.stepType,
      },
    })

    return NextResponse.json({
      success: true,
      data: step,
    })
  } catch (error) {
    console.error('Error creating wizard step definition:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create step definition' },
      { status: 500 }
    )
  }
}
