import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            )
        }

        const config = await request.json()

        // Obtener el producto base de la línea
        const line = await prisma.productLine.findUnique({
            where: { id: config.lineId },
            include: { products: true }
        })

        if (!line || !line.products[0]) {
            return NextResponse.json(
                { success: false, error: 'Línea de producto no encontrada' },
                { status: 404 }
            )
        }

        const baseProduct = line.products[0]

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
            },
            include: {
                product: {
                    include: {
                        category: true,
                    }
                }
            }
        })

        return NextResponse.json({
            success: true,
            data: quoteItem
        })
    } catch (error) {
        console.error('Error creating configured product item:', error)
        const message = (error as Error).message || 'Unknown error'
        return NextResponse.json({
            success: false,
            error: `Error al crear item configurado: ${message}`
        }, { status: 500 })
    }
}
