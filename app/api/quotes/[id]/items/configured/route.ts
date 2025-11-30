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

        // Log the received config
        fs.appendFileSync(logFile, `[${new Date().toISOString()}] Received config: ${JSON.stringify(config, null, 2)}\n`)

        // Obtener el producto base usando el ID proporcionado
        const baseProduct = await prisma.product.findUnique({
            where: { id: config.productId }
        })

        if (!baseProduct) {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Error: Product not found for productId: ${config.productId}\n`)
            return NextResponse.json(
                { success: false, error: 'Producto no encontrado' },
                { status: 404 }
            )
        }

        // Verificar que la línea existe
        const line = await prisma.productLine.findUnique({
            where: { id: config.lineId }
        })

        if (!line) {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] Error: Line not found for lineId: ${config.lineId}\n`)
            return NextResponse.json(
                { success: false, error: 'Línea de producto no encontrada' },
                { status: 404 }
            )
        }

        // Crear el quote item con la configuración
        const quoteItem = await prisma.quoteItem.create({
            data: {
                productLineId: config.lineId,
                quoteId: params.id,
                productId: baseProduct.id,
                quantity: config.quantity,
                unitPrice: config.totalPrice / config.quantity,
                totalPrice: config.totalPrice,
                customWidth: config.width,
                customHeight: config.height,
                productToneId: config.toneId,
                handleModelId: config.handleId,
                isTwoSided: config.cars === 2,
                isExhibition: config.isExhibition || false,
                isExpressDelivery: config.isExpressDelivery || false,
            },
            include: {
                product: {
                    include: {
                        category: true,
                    }
                }
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
