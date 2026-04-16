import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lineId = searchParams.get('lineId')

    const whereClause: any = {}

    if (lineId) {
      whereClause.linea = lineId
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        coleccion: true,
        tonoColor: true,
        precioBaseM2: true,
        puertaAnchoMin: true,
        puertaAnchoMax: true,
        puertaAltoMin: true,
        puertaAltoMax: true,
      },
    })

    const lines = await prisma.productLine.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { sortOrder: 'asc' },
    })

    const collections = await prisma.product.findMany({
      where: { 
        linea: lineId || undefined,
        coleccion: { not: null },
      },
      select: { coleccion: true },
      distinct: ['coleccion'],
      orderBy: { coleccion: 'asc' },
    })

    const tones = await prisma.product.findMany({
      where: { 
        linea: lineId || undefined,
        tonoColor: { not: null },
      },
      select: { tonoColor: true },
      distinct: ['tonoColor'],
      orderBy: { tonoColor: 'asc' },
    })

    let dimensions = { minWidth: 0, maxWidth: 0, minHeight: 0, maxHeight: 0 }
    if (products.length > 0) {
      dimensions = {
        minWidth: Math.min(...products.map(p => p.puertaAnchoMin || 0).filter(w => w > 0)),
        maxWidth: Math.max(...products.map(p => p.puertaAnchoMax || 0).filter(w => w > 0)),
        minHeight: Math.min(...products.map(p => p.puertaAltoMin || 0).filter(h => h > 0)),
        maxHeight: Math.max(...products.map(p => p.puertaAltoMax || 0).filter(h => h > 0)),
      }
    }

    const response = {
      lines,
      collections: collections.map(c => c.coleccion!).filter(Boolean),
      tones: tones.map(t => t.tonoColor!).filter(Boolean),
      orientations: [] as string[],
      faces: [] as number[],
      dimensions,
      products: products.map(p => ({
        id: p.id,
        name: p.name,
        collection: p.coleccion,
        colorToneText: p.tonoColor,
        basePrice: p.precioBaseM2 || 0,
        minWidth: p.puertaAnchoMin || 0,
        maxWidth: p.puertaAnchoMax || 0,
        minHeight: p.puertaAltoMin || 0,
        maxHeight: p.puertaAltoMax || 0,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching product options:', error)
    return NextResponse.json(
      { error: 'Error al obtener opciones de productos' },
      { status: 500 }
    )
  }
}
