import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import * as XLSX from 'xlsx'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener datos de la cotización
    const [quote, companySettings] = await Promise.all([
      prisma.quote.findUnique({
        where: { id: params.id },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              companyName: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
              productLine: true,
              productTone: true,
              handleModel: true,
            },
          },
        },
      }),
      prisma.companySettings.findFirst()
    ])

    if (!quote) {
      return NextResponse.json(
        { error: 'Cotización no encontrada' },
        { status: 404 }
      )
    }

    // Verificar acceso
    if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    // Crear libro de Excel
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Información de la cotización
    const quoteInfoData = [
      ['COTIZACIÓN', quote.quoteNumber],
      [''],
      ['EMPRESA', companySettings?.companyName || 'Module al Dente'],
      [''],
      ['INFORMACIÓN DEL CLIENTE'],
      ['Nombre', quote.customerName],
      ['Email', quote.customerEmail],
      ['Teléfono', quote.customerPhone || 'N/A'],
      ['Dirección', quote.customerAddress || 'N/A'],
      [''],
      ['INFORMACIÓN DEL PROYECTO'],
      ['Nombre del Proyecto', quote.projectName],
      ['Dirección del Proyecto', quote.projectAddress || 'N/A'],
      [''],
      ['FECHAS'],
      ['Fecha de Creación', new Date(quote.createdAt).toLocaleDateString('es-MX')],
      ['Válida Hasta', new Date(quote.validUntil).toLocaleDateString('es-MX')],
      ['Fecha de Entrega', quote.deliveryDate ? new Date(quote.deliveryDate).toLocaleDateString('es-MX') : 'N/A'],
      [''],
      ['ESTADO', getStatusDisplayName(quote.status)],
      [''],
      ['CREADO POR', quote.user.name],
    ]

    if (quote.notes) {
      quoteInfoData.push([''], ['NOTAS'], [quote.notes])
    }

    const wsInfo = XLSX.utils.aoa_to_sheet(quoteInfoData)
    
    // Ajustar anchos de columnas
    wsInfo['!cols'] = [
      { wch: 25 },
      { wch: 40 },
    ]

    XLSX.utils.book_append_sheet(workbook, wsInfo, 'Información')

    // Hoja 2: Productos
    const productsData = [
      [
        'Producto',
        'SKU',
        'Categoría',
        'Línea',
        'Tono',
        'Jaladera',
        'Caras',
        'Ancho (mm)',
        'Alto (mm)',
        'Área (m²)',
        'Cantidad',
        'Precio Unitario',
        'Total'
      ],
      ...quote.items.map((item: any) => {
        const area = item.customWidth && item.customHeight
          ? ((item.customWidth * item.customHeight) / 1000000).toFixed(4)
          : '-'
        
        return [
          item.product.name,
          item.product.sku,
          item.product.category?.name || 'N/A',
          item.productLine?.name || 'N/A',
          item.productTone?.name || 'N/A',
          item.handleModel ? `${item.handleModel.model} - ${item.handleModel.finish}` : 'Sin jaladera',
          item.isTwoSided ? '2 Caras' : '1 Cara',
          item.customWidth || item.product.width,
          item.customHeight || item.product.height,
          area,
          item.quantity,
          item.unitPrice,
          item.totalPrice
        ]
      })
    ]

    const wsProducts = XLSX.utils.aoa_to_sheet(productsData)
    
    // Ajustar anchos de columnas
    wsProducts['!cols'] = [
      { wch: 30 }, // Producto
      { wch: 15 }, // SKU
      { wch: 15 }, // Categoría
      { wch: 15 }, // Línea
      { wch: 15 }, // Tono
      { wch: 20 }, // Jaladera
      { wch: 10 }, // Caras
      { wch: 12 }, // Ancho
      { wch: 12 }, // Alto
      { wch: 12 }, // Área
      { wch: 10 }, // Cantidad
      { wch: 15 }, // Precio Unitario
      { wch: 15 }, // Total
    ]

    XLSX.utils.book_append_sheet(workbook, wsProducts, 'Productos')

    // Hoja 3: Resumen financiero
    const summaryData = [
      ['RESUMEN FINANCIERO'],
      [''],
      ['Subtotal', quote.subtotal],
      ['IVA (16%)', quote.taxAmount],
      ['Descuento', quote.discountAmount || 0],
      [''],
      ['TOTAL', quote.totalAmount],
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
    wsSummary['!cols'] = [
      { wch: 20 },
      { wch: 20 },
    ]

    XLSX.utils.book_append_sheet(workbook, wsSummary, 'Resumen')

    // Generar buffer del Excel
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    })

    // Retornar el archivo Excel
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="cotizacion-${quote.quoteNumber}.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel generation error:', error)
    return NextResponse.json(
      { error: 'Error al generar Excel' },
      { status: 500 }
    )
  }
}

function getStatusDisplayName(status: string): string {
  switch (status) {
    case 'DRAFT': return 'Borrador'
    case 'PENDING': return 'Pendiente'
    case 'APPROVED': return 'Aprobada'
    case 'REJECTED': return 'Rechazada'
    default: return status
  }
}