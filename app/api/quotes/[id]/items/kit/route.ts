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

        // Find the product line (Vidrio or Cerámica)
        const lineName = config.line || 'Vidrio'
        const productLine = await prisma.productLine.findFirst({
            where: { name: lineName }
        })

        if (!productLine) {
            return NextResponse.json(
                { success: false, error: `No se encontró la línea de producto: ${lineName}` },
                { status: 404 }
            )
        }

        // Find a product in the selected line
        const product = await prisma.product.findFirst({
            where: { lineId: productLine.id }
        })

        if (!product) {
            return NextResponse.json(
                { success: false, error: `No se encontró un producto base para la línea ${lineName}` },
                { status: 404 }
            )
        }

        // Find tone if specified
        let toneId = null
        if (config.tone) {
            const tone = await prisma.productTone.findFirst({
                where: { name: config.tone }
            })
            toneId = tone?.id || null
        }

        // Find handle if specified and not "No aplica"
        let handleId = null
        if (config.handle && config.handle !== 'No aplica') {
            const handle = await prisma.handleModel.findFirst({
                where: { name: config.handle }
            })
            handleId = handle?.id || null
        }

        // Calculate pricing
        const { dimensions, pricing } = config
        const unitPrice = pricing.basePrice / dimensions.quantity + (pricing.handlePrice / dimensions.quantity)
        const totalPrice = pricing.total

        // Get the price per square meter from the tone (this comes from the wizard)
        const pricePerSquareMeter = config.pricePerSquareMeter || 0

        // Create the quote item
        const quoteItem = await prisma.quoteItem.create({
            data: {
                quoteId: params.id,
                productId: product.id,
                productLineId: productLine.id,
                quantity: dimensions.quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                pricePerSquareMeter: pricePerSquareMeter,
                customWidth: dimensions.width,
                customHeight: dimensions.height,
                productToneId: toneId,
                handleModelId: handleId,
                isTwoSided: config.backFace === 'Especialidad',
                edgeBanding: config.edgeBanding,
                ceramicColor: config.color || null,
                isExhibition: config.isExhibition || false,
                isExpressDelivery: config.isExpressDelivery || false,
                // Store additional kit configuration in notes or custom fields
                packagingCost: 0,
            },
            include: {
                product: {
                    include: {
                        category: true,
                    }
                },
                productLine: true,
                productTone: true,
                handleModel: true,
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
        console.error('Error creating kit item:', error)
        const message = (error as Error).message || 'Unknown error'

        return NextResponse.json({
            success: false,
            error: `Error al crear kit: ${message}`
        }, { status: 500 })
    }
}
