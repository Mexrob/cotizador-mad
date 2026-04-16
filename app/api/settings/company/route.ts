
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    let settings = await prisma.companySettings.findFirst()

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          companyName: 'Cocinas de Lujo México',
          address: 'Av. Presidente Masaryk 111',
          city: 'Ciudad de México',
          state: 'CDMX',
          zipCode: '11560',
          phone: '+52 55 1234 5678',
          email: 'contacto@cocinaslujo.mx',
          taxId: 'CLM123456789',
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Company settings fetch error:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const authGuardResponse = adminAuthGuard(session)
    if (authGuardResponse) return authGuardResponse

    const body = await request.json()
    const {
      companyName,
      logo,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      taxId,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      currency,
      timezone,
      language,
      sessionTimeoutMinutes,
      expressDeliveryPercentage,
      exhibitionPercentage,
    } = body

    // Get existing settings or create new ones
    const existingSettings = await prisma.companySettings.findFirst()

    let settings
    if (existingSettings) {
      settings = await prisma.companySettings.update({
        where: { id: existingSettings.id },
        data: {
          companyName,
          logo,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
          website,
          taxId,
          primaryColor,
          secondaryColor,
          tertiaryColor,
          currency,
          timezone,
          language,
          sessionTimeoutMinutes,
          expressDeliveryPercentage,
          exhibitionPercentage,
        },
      })
    } else {
      settings = await prisma.companySettings.create({
        data: {
          companyName,
          logo,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
          website,
          taxId,
          primaryColor,
          secondaryColor,
          tertiaryColor,
          currency,
          timezone,
          language,
          sessionTimeoutMinutes,
          expressDeliveryPercentage,
          exhibitionPercentage,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Configuración actualizada exitosamente',
    })
  } catch (error) {
    console.error('Company settings update error:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    return NextResponse.json(
      { error: 'Error al actualizar configuración', details: (error as Error).message },
      { status: 500 }
    )
  }
}
