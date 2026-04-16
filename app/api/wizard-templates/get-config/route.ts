import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const code = searchParams.get('code')

    let template = null

    if (id || code) {
        template = await prisma.wizardTemplate.findFirst({
          where: {
            OR: [
              ...(id ? [{ id }] : []),
              ...(code ? [{ code }] : []),
            ],
            isActive: true,
          },
          select: {
            name: true,
            stepsConfig: true,
            pricingConfig: true,
            validationRules: true,
            uiConfig: true,
          }
        })
    } else {
      const userId = session.user.id
      const userRole = session.user.role as UserRole

      const assignments = await prisma.wizardAssignment.findMany({
        where: {
          template: { isActive: true },
        },
        orderBy: { priority: 'desc' },
      })

      const validAssignment = assignments.find(a => {
        if (a.userId === userId || a.role === userRole) {
          const now = new Date()
          const fromOk = !a.validFrom || a.validFrom <= now
          const untilOk = !a.validUntil || a.validUntil >= now
          return fromOk && untilOk
        }
        return false
      })

      if (validAssignment) {
        template = await prisma.wizardTemplate.findUnique({
          where: { id: validAssignment.templateId },
          select: {
            name: true,
            stepsConfig: true,
            pricingConfig: true,
            validationRules: true,
            uiConfig: true,
          }
        })
      } else {
        template = await prisma.wizardTemplate.findFirst({
          where: { isActive: true, isDefault: true },
          select: {
            name: true,
            stepsConfig: true,
            pricingConfig: true,
            validationRules: true,
            uiConfig: true,
          }
        })
      }
    }

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        name: template.name,
        config: {
          steps: template.stepsConfig,
          pricing: template.pricingConfig,
          validation: template.validationRules,
          ui: template.uiConfig,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching wizard config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch config' },
      { status: 500 }
    )
  }
}
