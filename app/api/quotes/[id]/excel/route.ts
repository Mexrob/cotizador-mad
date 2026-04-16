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
              taxId: true,
              fiscalRegime: true,
              cfdiUse: true,
              phone: true,
              billingAddress: true,
            },
          },
          items: {
            include: {
              product: true,
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
      ['Empresa', quote.user.companyName || 'N/A'],
      ['Email', quote.customerEmail],
      ['Teléfono', quote.customerPhone || quote.user.phone || 'N/A'],
      ['Dirección', quote.customerAddress || 'N/A'],
      [''],
      ['DATOS DE FACTURACIÓN'],
      ['RFC', quote.user.taxId || 'N/A'],
      ['Régimen Fiscal', quote.user.fiscalRegime || 'N/A'],
      ['Uso de CFDI', quote.user.cfdiUse || 'N/A'],
      ['Dirección Fiscal', quote.user.billingAddress ?
        `${quote.user.billingAddress.street} ${quote.user.billingAddress.number}, ${quote.user.billingAddress.colony}, ${quote.user.billingAddress.city}, ${quote.user.billingAddress.state}, CP ${quote.user.billingAddress.zipCode}`
        : 'N/A'],
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
        'Tono',
        'Color Cerámica',
        'Alto (mm)',
        'Ancho (mm)',
        'Costo unitario',
        'Cantidad',
        'Caras',
        'Cubrecanto',
        'Jaladera',
        'Precio Jaladera',
        'Cant. Jaladeras',
        'Tiempo Entrega',
        'Envío Express',
        'Demo',
        'Total'
      ],
      ...quote.items.map((item: any) => {
        const width = item.customWidth || item.product.width || 0
        const height = item.customHeight || item.product.height || 0
        const unitCost = (item.unitPrice || 0) - (item.packagingCost || 0)

        const handleName = item.handleModel?.name || '-'
        const handlePrice = item.packagingCost || 0
        const handleQuantity = item.handleModel ? item.quantity : '-'

        const expressAmount = item.isExpressDelivery ? item.expressAmount || 0 : 0
        const exhibitionAmount = item.isExhibition ? item.exhibitionAmount || 0 : 0

        const tiempoEntrega = item.product?.tiempoEntrega || 7

        return [
          item.product.name,
          item.productTone?.name || '-',
          item.ceramicColor || '-',
          height > 0 ? height : '-',
          width > 0 ? width : '-',
          unitCost,
          item.quantity,
          item.ceramicColor || (item.isTwoSided ? '2' : '1'),
          item.edgeBanding || '-',
          handleName,
          handlePrice > 0 ? handlePrice : '-',
          handleQuantity,
          tiempoEntrega + ' días',
          expressAmount > 0 ? expressAmount : '-',
          exhibitionAmount > 0 ? exhibitionAmount : '-',
          item.totalPrice
        ]
      })
    ]

    const wsProducts = XLSX.utils.aoa_to_sheet(productsData)

    // Aplicar formato de moneda MXN a las columnas de precio
    const range = XLSX.utils.decode_range(wsProducts['!ref'] || 'A1')
    for (let row = 1; row <= range.e.r; row++) {
      // Columna F (5): Costo unitario
      const unitCostCell = XLSX.utils.encode_cell({ r: row, c: 5 })
      if (wsProducts[unitCostCell] && typeof wsProducts[unitCostCell].v === 'number') {
        wsProducts[unitCostCell].z = '$#,##0.00'
        wsProducts[unitCostCell].t = 'n'
      }

      // Columna K (10): Precio Jaladera
      const handlePriceCell = XLSX.utils.encode_cell({ r: row, c: 10 })
      if (wsProducts[handlePriceCell] && typeof wsProducts[handlePriceCell].v === 'number') {
        wsProducts[handlePriceCell].z = '$#,##0.00'
        wsProducts[handlePriceCell].t = 'n'
      }

      // Columna M (12): Envío Express
      const expressFeeCell = XLSX.utils.encode_cell({ r: row, c: 12 })
      if (wsProducts[expressFeeCell] && typeof wsProducts[expressFeeCell].v === 'number') {
        wsProducts[expressFeeCell].z = '$#,##0.00'
        wsProducts[expressFeeCell].t = 'n'
      }

      // Columna N (13): Demo
      const exhibitionFeeCell = XLSX.utils.encode_cell({ r: row, c: 13 })
      if (wsProducts[exhibitionFeeCell] && typeof wsProducts[exhibitionFeeCell].v === 'number') {
        wsProducts[exhibitionFeeCell].z = '$#,##0.00'
        wsProducts[exhibitionFeeCell].t = 'n'
      }

      // Columna O (14): Total
      const totalCell = XLSX.utils.encode_cell({ r: row, c: 14 })
      if (wsProducts[totalCell] && typeof wsProducts[totalCell].v === 'number') {
        wsProducts[totalCell].z = '$#,##0.00'
        wsProducts[totalCell].t = 'n'
      }
    }

    // Ajustar anchos de columnas
    wsProducts['!cols'] = [
      { wch: 30 }, // Producto
      { wch: 15 }, // Tono
      { wch: 15 }, // Color Cerámica
      { wch: 12 }, // Alto
      { wch: 12 }, // Ancho
      { wch: 15 }, // Costo unitario
      { wch: 10 }, // Cantidad
      { wch: 8 },  // Caras
      { wch: 20 }, // Cubrecanto
      { wch: 25 }, // Jaladera
      { wch: 15 }, // Precio Jaladera
      { wch: 12 }, // Cant. Jaladeras
      { wch: 15 }, // Envío Express
      { wch: 15 }, // Demo
      { wch: 15 }, // Total
    ]

    XLSX.utils.book_append_sheet(workbook, wsProducts, 'Productos')

    // Hoja 3: Resumen financiero
    const summaryData = [
      ['RESUMEN FINANCIERO'],
      [''],
      ['Subtotal', parseFloat(quote.subtotal.toFixed(2))],
      ['IVA (16%)', parseFloat(quote.taxAmount.toFixed(2))],
      ['Descuento', parseFloat((quote.discountAmount || 0).toFixed(2))],
      [''],
      ['TOTAL', parseFloat(quote.totalAmount.toFixed(2))],
    ]

    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)

    // Aplicar formato de moneda MXN a las celdas de precio
    const summaryRange = XLSX.utils.decode_range(wsSummary['!ref'] || 'A1')
    for (let row = 0; row <= summaryRange.e.r; row++) {
      const priceCell = XLSX.utils.encode_cell({ r: row, c: 1 })
      if (wsSummary[priceCell] && typeof wsSummary[priceCell].v === 'number') {
        wsSummary[priceCell].z = '$#,##0.00'
        wsSummary[priceCell].t = 'n'
      }
    }

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
    case 'PAID': return 'Pagada'
    default: return status
  }
}