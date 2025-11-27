
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
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
      prisma.companySettings.findFirst({
        select: {
          companyName: true,
          logo: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          phone: true,
          email: true,
          website: true,
          primaryColor: true,
          secondaryColor: true,
          tertiaryColor: true,
        },
      })
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
        
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .header-logo {
            height: 60px;
            width: auto;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 8px;
        }
        
        .header-right {
            text-align: right;
        }
        
        .header h1 {
            font-size: 2rem;
            margin-bottom: 5px;
        }
        
        .header p {
            opacity: 0.9;
            font-size: 1.1rem;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        
        .info-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid ${primaryColor};
        }
        
        .info-card h3 {
            color: ${primaryColor};
            margin-bottom: 15px;
            font-size: 1.1rem;
        }
        
        .info-item {
            margin-bottom: 8px;
        }
        
        .info-label {
            font-weight: bold;
            color: #64748b;
            font-size: 0.9rem;
        }
        
        .info-value {
            color: #1e293b;
            margin-left: 5px;
        }
        
        .products-section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 1.5rem;
            color: #1e293b;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .products-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 0.9rem;
        }
        
        .products-table th,
        .products-table td {
            padding: 10px 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
        }
        
        .products-table th {
            background: #f1f5f9;
            font-weight: bold;
            color: #475569;
            font-size: 0.85rem;
            white-space: nowrap;
        }
        
        .products-table tr:hover {
            background: #f8fafc;
        }
        
        /* Specific column widths for better layout */
        .products-table th:nth-child(1) { width: 25%; } /* Producto */
        .products-table th:nth-child(2) { width: 12%; } /* SKU */
        .products-table th:nth-child(3) { width: 15%; } /* Categoría */
        .products-table th:nth-child(4) { width: 12%; } /* Dimensiones */
        .products-table th:nth-child(5) { width: 8%; }  /* Área */
        .products-table th:nth-child(6) { width: 8%; }  /* Cantidad */
        .products-table th:nth-child(7) { width: 10%; } /* Precio Unitario */
        .products-table th:nth-child(8) { width: 10%; } /* Total */
        
        .total-section {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
        }
        
        .total-row.final {
            font-size: 1.2rem;
            font-weight: bold;
            color: ${primaryColor};
            border-top: 2px solid #e2e8f0;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .notes-section {
            margin-top: 30px;
            padding: 20px;
            background: #fefce8;
            border-radius: 8px;
            border-left: 4px solid #eab308;
        }
        
        .footer {
            margin-top: 40px;
            padding: 20px;
            background: #1e293b;
            color: white;
            border-radius: 8px;
            text-align: center;
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-draft { background: #dbeafe; color: ${primaryColor}; }
        .status-pending { background: #fef3c7; color: #d97706; }
        .status-approved { background: #d1fae5; color: #059669; }
        .status-rejected { background: #fee2e2; color: #dc2626; }
        
        @media print {
            .container {
                padding: 0;
            }
            
            .header {
                background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor}) !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
            
            .info-card {
                border-left-color: ${primaryColor} !important;
                -webkit-print-color-adjust: exact;
            }
            
            .total-row.final {
                color: ${primaryColor} !important;
                -webkit-print-color-adjust: exact;
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
            <table class="products-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>SKU</th>
                        <th>Categoría</th>
                        <th>Dimensiones (mm)</th>
                        <th>Área (m²)</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${quote.items.map((item: any) => {
                        // Formatear dimensiones
                        const formatDimensions = () => {
                            if (item.customWidth && item.customHeight) {
                                const width = Math.round(item.customWidth);
                                const height = Math.round(item.customHeight);
                                return `${width} × ${height}`;
                            }
                            return 'Estándar';
                        };
                        
                        // Calcular área en m²
                        const calculateArea = () => {
                            if (item.customWidth && item.customHeight) {
                                const areaM2 = (item.customWidth * item.customHeight) / (1000 * 1000);
                                return areaM2.toFixed(2);
                            }
                            return '-';
                        };
                        
                        return `
                        <tr>
                            <td>${item.product.name}</td>
                            <td>${item.product.sku}</td>
                            <td>${item.product.category?.name || 'N/A'}</td>
                            <td style="text-align: center;">${formatDimensions()}</td>
                            <td style="text-align: center;">${calculateArea()}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">${formatMXN(item.unitPrice)}</td>
                            <td style="text-align: right;">${formatMXN(item.totalPrice)}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="total-section">
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
    default: return status
  }
}
