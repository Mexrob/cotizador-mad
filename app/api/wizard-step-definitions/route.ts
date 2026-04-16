import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
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
