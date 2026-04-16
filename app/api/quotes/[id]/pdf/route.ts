
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { adminAuthGuard } from '@/lib/authUtils'
import { formatMXN, formatDate } from '@/lib/utils'

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

        // Check if user has access to this quote
        // The previous logic (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) is correct.
        // adminAuthGuard only checks for Admin role, which is not sufficient here.

        // Obtener datos en paralelo
        const [quote, companySettings] = await Promise.all([
            prisma.quote.findUnique({
                where: { id: params.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                            companyName: true,
                        },
                    },
                    items: {
                        include: {
                            product: true,
                            handleModel: true,
                            productLine: true,
                            productTone: true,
                            woodGrain: true,
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

        // Check if user has access to this quote
        if (session.user.role !== 'ADMIN' && quote.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 403 }
            )
        }

        // Generate HTML for PDF
        const htmlContent = generateQuotePDFHTML(quote, companySettings)

        // For now, return the HTML content with proper headers
        // In production, you could integrate with libraries like puppeteer to generate actual PDFs
        return new NextResponse(htmlContent, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; filename="cotizacion-${quote.quoteNumber}.html"`,
            },
        })
    } catch (error) {
        console.error('PDF generation error:', error)
        return NextResponse.json(
            { error: 'Error al generar PDF' },
            { status: 500 }
        )
    }
}

function generateQuotePDFHTML(quote: any, companySettings: any): string {
    // Preparar datos de la empresa con fallbacks
    const companyName = companySettings?.companyName || quote.user.companyName || 'Cocinas de Lujo'
    // Si el logo ya tiene una ruta completa (empieza con / o http), úsala directamente
    const logoUrl = companySettings?.logo ? companySettings.logo : null
    const primaryColor = companySettings?.primaryColor || '#2563eb'
    const secondaryColor = companySettings?.secondaryColor || '#1d4ed8'

    // Información de contacto corporativa
    const companyContact = companySettings ? {
        address: companySettings.address,
        city: companySettings.city,
        state: companySettings.state,
        zipCode: companySettings.zipCode,
        country: companySettings.country,
        phone: companySettings.phone,
        email: companySettings.email,
        website: companySettings.website
    } : null
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotización ${quote.quoteNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        @page {
            size: letter;
            margin: 1mm;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #333;
            background: #fff;
            font-size: 10pt;
        }
        
        .container {
            max-width: 100%;
            margin: 0 auto;
            padding: 5px;
        }
        
        .header {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .header-logo {
            height: 45px;
            width: auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            padding: 6px;
        }
        
        .header-right {
            text-align: right;
        }
        
        .header h1 {
            font-size: 1.3rem;
            margin-bottom: 3px;
        }
        
        .header h2 {
            font-size: 1.1rem;
            margin-bottom: 3px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 0.85rem;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .info-card {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border-left: 3px solid ${primaryColor};
        }
        
        .info-card h3 {
            color: ${primaryColor};
            margin-bottom: 8px;
            font-size: 0.9rem;
        }
        
        .info-item {
            margin-bottom: 5px;
            font-size: 0.8rem;
        }
        
        .info-label {
            font-weight: bold;
            color: #64748b;
            font-size: 0.75rem;
        }
        
        .info-value {
            color: #1e293b;
            margin-left: 5px;
        }
        
        .products-section {
            margin-bottom: 15px;
        }
        
        .section-title {
            font-size: 1rem;
            color: #1e293b;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 0.6rem;
            table-layout: fixed;
        }
        
        .products-table th,
        .products-table td {
            padding: 3px 2px;
            text-align: left;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .products-table th {
            background: #f1f5f9;
            font-weight: bold;
            color: #475569;
            font-size: 0.55rem;
            white-space: nowrap;
            border: 1px solid #94a3b8;
        }
        
        .products-table tr:hover {
            background: #f8fafc;
        }
        
        .total-section {
            background: #f8fafc;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            font-size: 0.85rem;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        
        .total-row.final {
            font-size: 1rem;
            font-weight: bold;
            color: ${primaryColor};
            border-top: 2px solid #e2e8f0;
            padding-top: 8px;
            margin-top: 8px;
        }
        
        .notes-section {
            margin-top: 15px;
            padding: 12px;
            background: #fefce8;
            border-radius: 6px;
            border-left: 3px solid #eab308;
            font-size: 0.8rem;
        }
        
        .footer {
            margin-top: 20px;
            padding: 12px;
            background: #1e293b;
            color: white;
            border-radius: 6px;
            text-align: center;
            font-size: 0.7rem;
        }
        
        .status-badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 0.65rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-draft { background: #dbeafe; color: ${primaryColor}; }
        .status-pending { background: #fef3c7; color: #d97706; }
        .status-approved { background: #d1fae5; color: #059669; }
        .status-rejected { background: #fee2e2; color: #dc2626; }
        
        @media print {
            body {
                font-size: 9pt;
            }
            
            .container {
                padding: 0;
                max-width: 100%;
            }
            
            .header {
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .info-card {
                border-left-color: ${primaryColor} !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .total-row.final {
                color: ${primaryColor} !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .products-table {
                font-size: 6pt;
            }
            
            .products-table th,
            .products-table td {
                padding: 2px 1px;
            }
            
            .footer {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
                ${logoUrl ? `
                <div>
                    <img src="${logoUrl}" alt="${companyName}" class="header-logo" />
                </div>
                ` : ''}
                <div>
                    <h1 style="font-size: ${logoUrl ? '1.8rem' : '2.2rem'}; margin: 0; font-weight: bold;">
                        ${companyName}
                    </h1>
                    ${logoUrl ? `<p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 0.9rem;">Sistema de Cotizaciones</p>` : ''}
                </div>
            </div>
            <div class="header-right">
                <h2 style="margin: 0; font-size: 1.5rem;">Cotización ${quote.quoteNumber}</h2>
                <p style="margin: 5px 0; opacity: 0.9;">${quote.projectName}</p>
                <div style="margin-top: 15px;">
                    <span class="status-badge status-${quote.status.toLowerCase()}">
                        ${getStatusDisplayName(quote.status)}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="info-grid">
            <div class="info-card">
                <h3>📋 Información del Cliente</h3>
                <div class="info-item">
                    <span class="info-label">Nombre:</span>
                    <span class="info-value">${quote.customerName}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${quote.customerEmail}</span>
                </div>
                ${quote.customerPhone ? `
                <div class="info-item">
                    <span class="info-label">Teléfono:</span>
                    <span class="info-value">${quote.customerPhone}</span>
                </div>
                ` : ''}
                ${quote.customerAddress ? `
                <div class="info-item">
                    <span class="info-label">Dirección:</span>
                    <span class="info-value">${quote.customerAddress}</span>
                </div>
                ` : ''}
            </div>
            
            <div class="info-card">
                <h3>🏗️ Información del Proyecto</h3>
                <div class="info-item">
                    <span class="info-label">Proyecto:</span>
                    <span class="info-value">${quote.projectName}</span>
                </div>
                ${quote.projectAddress ? `
                <div class="info-item">
                    <span class="info-label">Dirección:</span>
                    <span class="info-value">${quote.projectAddress}</span>
                </div>
                ` : ''}
                <div class="info-item">
                    <span class="info-label">Fecha de creación:</span>
                    <span class="info-value">${formatDate(quote.createdAt)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Válida hasta:</span>
                    <span class="info-value">${formatDate(quote.validUntil)}</span>
                </div>
                ${quote.deliveryDate ? `
                <div class="info-item">
                    <span class="info-label">Fecha de entrega:</span>
                    <span class="info-value">${formatDate(quote.deliveryDate)}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="products-section">
            <h2 class="section-title">📦 Productos Cotizados</h2>
            ${quote.items.map((item: any) => {
        const width = item.customWidth || item.product.width || 0
        const height = item.customHeight || item.product.height || 0
        const area = width && height ? ((width * height / 1000000) * item.quantity).toFixed(2) : '-'
        
        const expressFormatted = item.expressAmount ? formatMXN(item.expressAmount) : '-'
        const exhibitionFormatted = item.exhibitionAmount ? formatMXN(item.exhibitionAmount) : '-'
        const handleCostFormatted = item.packagingCost ? formatMXN(item.packagingCost) : '-'
        
        const vetaOrientation = item.woodGrain?.name || (item.isTwoSided ? 'Vertical' : '-')
        const toneColor = item.productTone?.name || item.ceramicColor || '-'
        const faces = item.isTwoSided ? '2' : '1'
        
        const lineName = (item.productLine?.name || '').toLowerCase()
        const isEuropa = lineName.includes('europa') || lineName.includes('alto brillo')
        
        if (isEuropa) {
            const tiempoEntrega = item.product?.tiempoEntrega || 7
            return `
            <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px;">
                <div style="background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-weight: bold; display: flex; justify-content: space-between; align-items: center;">
                    <span>Producto: ${item.product.name}</span>
                    <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${tiempoEntrega} días de entrega</span>
                </div>
                <table class="products-table" style="margin-bottom: 0;">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Tono/Color</th>
                            <th>Orientación veta</th>
                            <th style="text-align: right;">Dimensiones</th>
                            <th style="text-align: right;">Cantidad</th>
                            <th style="text-align: right;">Área total</th>
                            <th style="text-align: right;">Costo unitario</th>
                            <th style="text-align: center;">Caras</th>
                            <th>Cubrecanto</th>
                            <th>Jaladera</th>
                            <th>Orientación</th>
                            <th style="text-align: right;">Costo Jaladera</th>
                            <th style="text-align: right;">Tiempo entrega</th>
                            <th style="text-align: right;">Envío express</th>
                            <th style="text-align: right;">Desc. exhibición</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${item.product.name}</td>
                            <td>${toneColor}</td>
                            <td>${vetaOrientation}</td>
                            <td style="text-align: right;">${height > 0 ? height + ' x ' + width + ' mm' : '-'}</td>
                            <td style="text-align: right;">${item.quantity}</td>
                            <td style="text-align: right;">${area} m²</td>
                            <td style="text-align: right;">${formatMXN(item.unitPrice)}</td>
                            <td style="text-align: center;">${faces}</td>
                            <td>${item.edgeBanding || '-'}</td>
                            <td>${item.handleModel?.name || '-'}</td>
                            <td>${vetaOrientation}</td>
                            <td style="text-align: right;">${handleCostFormatted}</td>
                            <td style="text-align: right;">${tiempoEntrega} días</td>
                            <td style="text-align: right; color: ${item.isExpressDelivery ? '#ea580c' : 'inherit'};">${expressFormatted}</td>
                            <td style="text-align: right; color: ${item.isExhibition ? '#1d4ed8' : 'inherit'};">${exhibitionFormatted}</td>
                            <td style="text-align: right;">${formatMXN(item.totalPrice)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            `
        }
        
        return `
        <div style="margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px;">
            <div style="background: #f1f5f9; padding: 8px 12px; border-bottom: 1px solid #cbd5e1; font-weight: bold;">
                Producto: ${item.product.name}
            </div>
            <table class="products-table" style="margin-bottom: 0;">
                <thead>
                    <tr>
                        <th style="text-align: right;">Alto</th>
                        <th style="text-align: right;">Ancho</th>
                        <th style="text-align: right;">Cantidad</th>
                        <th>Color/Tono</th>
                        <th>Cubrecanto</th>
                        <th>Jaladera</th>
                        <th>Orientación Veta</th>
                        <th style="text-align: right;">Envío Express</th>
                        <th style="text-align: right;">Exhibición</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="text-align: right;">${height > 0 ? height + ' mm' : '-'}</td>
                        <td style="text-align: right;">${width > 0 ? width + ' mm' : '-'}</td>
                        <td style="text-align: right;">${item.quantity}</td>
                        <td>${toneColor}</td>
                        <td>${item.edgeBanding || '-'}</td>
                        <td>${item.handleModel?.name || '-'}</td>
                        <td>${vetaOrientation}</td>
                        <td style="text-align: right; color: ${item.isExpressDelivery ? '#ea580c' : 'inherit'};">${expressFormatted}</td>
                        <td style="text-align: right; color: ${item.isExhibition ? '#1d4ed8' : 'inherit'};">${exhibitionFormatted}</td>
                        <td style="text-align: right;">${formatMXN(item.totalPrice)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        `
    }).join('')}
        </div>
        
        ${(() => {
        const expressDeliveryPercentage = companySettings?.expressDeliveryPercentage || 20
        const exhibitionPercentage = companySettings?.exhibitionPercentage || 25
        const totalExpressFees = quote.items.reduce((sum: number, item: any) => sum + (item.expressAmount || 0), 0)
        const totalExhibitionFees = quote.items.reduce((sum: number, item: any) => sum + (item.exhibitionAmount || 0), 0)
        
        return `
        <div class="total-section">
            ${totalExpressFees > 0 ? `
            <div class="total-row" style="color: #ea580c;">
                <span>Envío Express (+${expressDeliveryPercentage}%):</span>
                <span>+${formatMXN(totalExpressFees)}</span>
            </div>
            ` : ''}
            ${totalExhibitionFees !== 0 ? `
            <div class="total-row" style="color: #1d4ed8;">
                <span>Producto de Exhibición (-${exhibitionPercentage}%):</span>
                <span>${formatMXN(totalExhibitionFees)}</span>
            </div>
            ` : ''}
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatMXN(quote.subtotal)}</span>
            </div>
            <div class="total-row">
                <span>IVA (16%):</span>
                <span>${formatMXN(quote.taxAmount)}</span>
            </div>
            ${quote.discountAmount && quote.discountAmount > 0 ? `
            <div class="total-row" style="color: #059669;">
                <span>Descuento:</span>
                <span>-${formatMXN(quote.discountAmount)}</span>
            </div>
            ` : ''}
            <div class="total-row final">
                <span>TOTAL:</span>
                <span>${formatMXN(quote.totalAmount)}</span>
            </div>
        </div>
        `
        })()}
        
        ${quote.roomDimensions ? `
        <div class="info-card" style="margin-top: 30px;">
            <h3>📏 Dimensiones de la Cocina</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 10px;">
                <div class="info-item">
                    <span class="info-label">Ancho:</span>
                    <span class="info-value">${quote.roomDimensions.width}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Alto:</span>
                    <span class="info-value">${quote.roomDimensions.height}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Profundidad:</span>
                    <span class="info-value">${quote.roomDimensions.depth}m</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Área total:</span>
                    <span class="info-value">${(quote.roomDimensions.width * quote.roomDimensions.depth).toFixed(1)}m²</span>
                </div>
            </div>
        </div>
        ` : ''}
        
        ${quote.notes ? `
        <div class="notes-section">
            <h3 style="margin-bottom: 10px;">📝 Notas y Comentarios</h3>
            <p>${quote.notes}</p>
        </div>
        ` : ''}
        
        <div class="footer">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; text-align: left;">
                <div>
                    <p style="font-size: 1.1rem; font-weight: bold; margin-bottom: 10px;">${companyName}</p>
                    ${companyContact ? `
                    <p style="margin: 3px 0;">📍 ${companyContact.address}</p>
                    <p style="margin: 3px 0;">${companyContact.city}, ${companyContact.state} ${companyContact.zipCode}</p>
                    <p style="margin: 3px 0;">${companyContact.country}</p>
                    ` : ''}
                </div>
                <div>
                    <p style="font-weight: bold; margin-bottom: 10px;">Información de Contacto</p>
                    ${companyContact?.phone ? `<p style="margin: 3px 0;">📞 ${companyContact.phone}</p>` : ''}
                    ${companyContact?.email ? `<p style="margin: 3px 0;">✉️ ${companyContact.email}</p>` : ''}
                    ${companyContact?.website ? `<p style="margin: 3px 0;">🌐 ${companyContact.website}</p>` : ''}
                    <p style="margin: 10px 0 3px 0; font-size: 0.9rem; opacity: 0.8;">Cotización generada por: ${quote.user.name}</p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
  `
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
