import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    const logFile = path.join(process.cwd(), 'debug-error.log')

    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            )
        }

        const config = await request.json()

        console.log('Backend Received config:', JSON.stringify(config, null, 2))
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Received config: ${JSON.stringify(config)}\n`)

        // Obtener el producto base
        let baseProduct = null
        if (config.productId) {
            baseProduct = await prisma.product.findUnique({
                where: { id: config.productId }
            })
        }

        // Si no hay productId o no se encontró, buscar un producto base por la línea
        if (!baseProduct && config.lineId) {
            // Primero buscar si lineId es un ID de productLine para obtener el nombre
            const line = await prisma.productLine.findUnique({
                where: { id: config.lineId }
            })
            
            // Buscar productos usando contains (más flexible)
            baseProduct = await prisma.product.findFirst({
                where: { 
                    linea: { contains: config.lineId, mode: 'insensitive' }
                }
            })
            
            // Si no encuentra, buscar por nombre de línea (case-insensitive)
            if (!baseProduct && line?.name) {
                baseProduct = await prisma.product.findFirst({
                    where: { 
                        linea: { equals: line.name, mode: 'insensitive' }
                    }
                })
            }
            
            // Último intento: buscar cualquier producto que contenga "Alto"
            if (!baseProduct) {
                baseProduct = await prisma.product.findFirst({
                    where: { 
                        linea: { contains: 'Alto' }
                    }
                })
            }
        }
        
        if (!baseProduct) {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Error: Product not found for lineId: ${config.lineId}\n`)
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            )
        }

        // Validate tiempo de entrega - prevent mixing different delivery times
        const existingItems = await prisma.quoteItem.findMany({
            where: { quoteId: params.id },
            include: { product: { select: { tiempoEntrega: true } } }
        })
        const existingTiempoEntrega = existingItems[0]?.product?.tiempoEntrega
        if (existingItems.length > 0 && existingTiempoEntrega !== baseProduct.tiempoEntrega) {
            return NextResponse.json(
                { success: false, error: `Error en el tiempo de entrega. Esta cotización tiene productos con ${existingTiempoEntrega} días. Solo puedes agregar productos con el mismo tiempo de entrega.` },
                { status: 400 }
            )
        }

        // Verificar que la línea existe - puede ser ID o nombre
        const lineIdOrName = config.lineId || baseProduct?.linea
        let line = null
        if (lineIdOrName) {
            line = await prisma.productLine.findUnique({
                where: { id: lineIdOrName }
            }) || await prisma.productLine.findFirst({
                where: { name: { equals: lineIdOrName, mode: 'insensitive' } }
            })
        }

        if (!line && lineIdOrName) {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Error: Line not found for lineIdOrName: ${lineIdOrName}\n`)
            return NextResponse.json(
                { success: false, error: 'Línea de producto no encontrada' },
                { status: 404 }
            )
        }

        // Log final antes de crear
        const lineIdToUse = line?.id || baseProduct?.linea
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Prisma Data: ${JSON.stringify({
            productLineId: lineIdToUse,
            quoteId: params.id,
            productId: baseProduct.id,
            quantity: config.quantity,
            isExhibition: config.isExhibition || config.demoProduct || false,
            isExpressDelivery: config.isExpressDelivery || config.expressShipping || false,
        })}\n`)

        const quoteItem = await prisma.quoteItem.create({
            data: {
                productLineId: lineIdToUse,
                quoteId: params.id,
                productId: baseProduct.id,
                quantity: config.quantity,
                unitPrice: config.unitPrice,
                totalPrice: config.totalPrice,
                customWidth: config.customWidth || config.width,
                customHeight: config.customHeight || config.height,
                productToneId: (config.toneId && config.toneId !== '') ? config.toneId : null,
                handleModelId: ((config.handleModelId || config.handleId) && (config.handleModelId || config.handleId) !== '') ? (config.handleModelId || config.handleId) : null,
                isTwoSided: config.isTwoSided || config.cars === 2,
                isExhibition: config.isExhibition || config.demoProduct || false,
                isExpressDelivery: config.isExpressDelivery || config.expressShipping || false,
                edgeBanding: config.edgeBanding || null,
                ceramicColor: config.ceramicColor || null,
                vetaOrientation: config.vetaOrientation || null,
                jaladera: config.jaladera || null,
                jaladeraOrientation: config.jaladeraOrientation || null,
                cubrecanto: config.cubrecanto || null,
                handlePrice: config.handlePrice,
                packagingCost: config.packagingCost || config.handlePrice || 0,
                expressAmount: config.expressAmount || 0,
                exhibitionAmount: config.exhibitionAmount || 0,
            },

            include: {
                product: true,
            }
        })

        // Recalculate quote totals
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({
            success: true,
            data: quoteItem
        })
    } catch (error) {
        console.error('Error creating configured product item:', error)
        const message = (error as Error).message || 'Unknown error'

        // Log detailed error to file
        let errorDetails = message
        if (error instanceof Error && 'code' in error) {
            errorDetails += ` | Code: ${(error as any).code} | Meta: ${JSON.stringify((error as any).meta)}`
        }
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] ERROR: ${errorDetails}\nStack: ${(error as Error).stack}\n`)

        return NextResponse.json({
            success: false,
            error: `Error al crear item configurado: ${message}`
        }, { status: 500 })
    }
}