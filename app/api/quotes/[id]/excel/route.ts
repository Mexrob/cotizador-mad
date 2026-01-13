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
        'Alto (mm)',
        'Ancho (mm)',
        'Precio m²',
        'Cantidad',
        'Caras',
        'Cubrecanto',
        'Costo unitario',
        'Jaladera',
        'Precio Jaladera',
        'Cant. Jaladeras',
        'Acabado Especial',
        'Producto Exhibición',
        'Envío Express',
        'Total'
      ],
      ...quote.items.map((item: any) => {
        const width = item.customWidth || item.product.width || 0
        const height = item.customHeight || item.product.height || 0
        const area = (width / 1000) * (height / 1000)

        const handlePrice = item.handleModel ? parseFloat(item.handleModel.price.toFixed(2)) : 0
        const baseUnitPrice = parseFloat((item.unitPrice - handlePrice).toFixed(2))
        const pricePerM2 = area > 0 ? parseFloat((baseUnitPrice / area).toFixed(2)) : 0

        const handleQuantity = item.handleModel ? item.quantity : 0

        // Calculate totals for this item
        const itemBaseTotal = baseUnitPrice * item.quantity
        const itemHandleTotal = handlePrice * item.quantity // handlePrice is already unit price
        const itemBackFaceFee = item.isTwoSided ? 100 : 0

        // Effective subtotal (Base + Handle + BackFace)
        const itemSubtotal = itemBaseTotal + itemHandleTotal + itemBackFaceFee

        // Calculate optional fees percentages
        const exhibitionFeeAmount = item.isExhibition ? itemSubtotal * -0.25 : 0
        const expressDeliveryFeeAmount = item.isExpressDelivery ? itemSubtotal * 0.20 : 0

        // Total for line item
        const itemTotal = itemSubtotal + exhibitionFeeAmount + expressDeliveryFeeAmount

        return [
          item.product.name,
          height,
          width,
          pricePerM2,
          item.quantity,
          item.isTwoSided ? '2' : '1',
          item.edgeBanding || '-',
          itemBaseTotal, // Using calculated base total
          item.handleModel ? `${item.handleModel.model} - ${item.handleModel.finish}` : 'Sin jaladera',
          handlePrice,
          handleQuantity,
          itemBackFaceFee > 0 ? itemBackFaceFee : 0,
          exhibitionFeeAmount,
          expressDeliveryFeeAmount,
          parseFloat(itemTotal.toFixed(2))
        ]
      })
    ]

    const wsProducts = XLSX.utils.aoa_to_sheet(productsData)

    // Aplicar formato de moneda MXN a las columnas de precio
    const range = XLSX.utils.decode_range(wsProducts['!ref'] || 'A1')
    for (let row = 1; row <= range.e.r; row++) {
      // Columna D (3): Precio m²
      const priceM2Cell = XLSX.utils.encode_cell({ r: row, c: 3 })
      if (wsProducts[priceM2Cell] && typeof wsProducts[priceM2Cell].v === 'number') {
        wsProducts[priceM2Cell].z = '$#,##0.00'
        wsProducts[priceM2Cell].t = 'n'
      }

      // Columna G (7): Costo unitario (Shifted by 1 due to Caras and Cubrecanto)
      const unitCostCell = XLSX.utils.encode_cell({ r: row, c: 7 })
      if (wsProducts[unitCostCell] && typeof wsProducts[unitCostCell].v === 'number') {
        wsProducts[unitCostCell].z = '$#,##0.00'
        wsProducts[unitCostCell].t = 'n'
      }

      // Columna I (9): Precio Jaladera
      const handlePriceCell = XLSX.utils.encode_cell({ r: row, c: 9 })
      if (wsProducts[handlePriceCell] && typeof wsProducts[handlePriceCell].v === 'number') {
        wsProducts[handlePriceCell].z = '$#,##0.00'
        wsProducts[handlePriceCell].t = 'n'
      }

      // Columna K (11): Acabado Especial (Nuevo)
      const backFaceCell = XLSX.utils.encode_cell({ r: row, c: 11 })
      if (wsProducts[backFaceCell] && typeof wsProducts[backFaceCell].v === 'number') {
        wsProducts[backFaceCell].z = '$#,##0.00'
        wsProducts[backFaceCell].t = 'n'
      }

      // Columna L (12): Producto Exhibición
      const exhibitionFeeCell = XLSX.utils.encode_cell({ r: row, c: 12 })
      if (wsProducts[exhibitionFeeCell] && typeof wsProducts[exhibitionFeeCell].v === 'number') {
        wsProducts[exhibitionFeeCell].z = '$#,##0.00'
        wsProducts[exhibitionFeeCell].t = 'n'
        // Optional: Color formatting for discount could be added here if library supports it easily, skipping for standard xlsx basic usage
      }

      // Columna M (13): Envío Express
      const expressFeeCell = XLSX.utils.encode_cell({ r: row, c: 13 })
      if (wsProducts[expressFeeCell] && typeof wsProducts[expressFeeCell].v === 'number') {
        wsProducts[expressFeeCell].z = '$#,##0.00'
        wsProducts[expressFeeCell].t = 'n'
      }

      // Columna N (14): Total
      const totalCell = XLSX.utils.encode_cell({ r: row, c: 14 })
      if (wsProducts[totalCell] && typeof wsProducts[totalCell].v === 'number') {
        wsProducts[totalCell].z = '$#,##0.00'
        wsProducts[totalCell].t = 'n'
      }
    }

    // Ajustar anchos de columnas
    wsProducts['!cols'] = [
      { wch: 30 }, // Producto
      { wch: 12 }, // Alto
      { wch: 12 }, // Ancho
      { wch: 15 }, // Precio m²
      { wch: 10 }, // Cantidad
      { wch: 8 },  // Caras
      { wch: 15 }, // Cubrecanto
      { wch: 15 }, // Costo unitario
      { wch: 25 }, // Jaladera
      { wch: 15 }, // Precio Jaladera
      { wch: 15 }, // Cant. Jaladeras
      { wch: 18 }, // Acabado Especial
      { wch: 18 }, // Producto Exhibición
      { wch: 15 }, // Envío Express
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