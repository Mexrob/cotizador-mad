import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const config = await request.json()
        console.log('Europea Sincro config received:', JSON.stringify(config, null, 2))

        // 1. Find ProductLine "Europea Sincro"
        const productLine = await prisma.productLine.findUnique({
            where: { name: 'Europea Sincro' }
        })

        if (!productLine) {
            console.error('ProductLine "Europea Sincro" not found')
            return new NextResponse('Resource not found', { status: 404 })
        }

        // 2. Find or Create Base Product
        let product = await prisma.product.findFirst({
            where: {
                name: 'Puerta Europea Sincro',
                lineId: productLine.id
            }
        })

        if (!product) {
            // Find category
            let category = await prisma.category.findFirst({
                where: { name: 'Puertas' }
            })

            if (!category) {
                // Fallback or create if missing (though unlikely if Basic worked)
                category = await prisma.category.create({
                    data: { name: 'Puertas', description: 'Puertas personalizadas' }
                })
            }

            product = await prisma.product.create({
                data: {
                    name: 'Puerta Europea Sincro',
                    description: 'Puerta fabricada con tecnología Sincro',
                    sku: 'EUROPEA-SINCRO',
                    categoryId: category.id,
                    lineId: productLine.id,
                    basePrice: 1400,

                    dimensionUnit: 'mm'
                }
            })
        }

        // 3. Find ProductTone
        const toneName = config.tone
        // We use findFirst to match name and lineId
        const tone = await prisma.productTone.findFirst({
            where: {
                lineId: productLine.id,
                name: toneName
            }
        })
        const toneId = tone ? tone.id : null

        // 4. Find Handle
        let handleId = null
        if (config.handle && config.handle !== 'No aplica') {
            const handle = await prisma.handleModel.findFirst({
                where: { name: config.handle }
            })
            if (handle) handleId = handle.id
        }

        // 5. Calculate Prices
        const dimensions = config.dimensions
        const optionals = config.optionals
        const area = (dimensions.width / 1000) * (dimensions.height / 1000)

        const SINCRO_PRICE = 1400
        const basePrice = area * SINCRO_PRICE * dimensions.quantity

        // Handle Price
        let handlePrice = 0
        if (handleId) {
            const handleModel = await prisma.handleModel.findUnique({ where: { id: handleId } })
            if (handleModel && handleModel.price) {
                handlePrice = Number(handleModel.price) * dimensions.quantity
            }
        }

        const subtotal = basePrice + handlePrice

        const exhibitionFee = optionals.isExhibition ? subtotal * -0.25 : 0
        const expressDeliveryFee = optionals.isExpressDelivery ? subtotal * 0.20 : 0
        const total = subtotal + exhibitionFee + expressDeliveryFee

        // Find WoodGrain
        let woodGrainId = null
        if (config.backFace === 'Horizontal' || config.backFace === 'Vertical') {
            const woodGrain = await prisma.woodGrain.findUnique({
                where: { name: config.backFace }
            })
            woodGrainId = woodGrain?.id
        }

        // 6. Create Quote Item
        const quoteItem = await prisma.quoteItem.create({
            data: {
                quoteId: params.id,
                productId: product.id,
                productLineId: productLine.id,
                quantity: dimensions.quantity,
                unitPrice: subtotal / dimensions.quantity,
                totalPrice: total,
                pricePerSquareMeter: SINCRO_PRICE,
                customWidth: dimensions.width,
                customHeight: dimensions.height,
                productToneId: toneId,
                handleModelId: handleId,
                woodGrainId: woodGrainId, // Save the grain direction relation
                edgeBanding: config.edgeBanding,
                // Use same logic as Basic for consistency
                isTwoSided: config.backFace === 'Horizontal' || config.backFace === 'Vertical',
                isExhibition: optionals.isExhibition,
                isExpressDelivery: optionals.isExpressDelivery,
            }
        })

        // 7. Recalculate Quote Totals
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({ success: true, data: quoteItem })

    } catch (error) {
        console.error('Error creating Europea Sincro item:', error)
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error
        })
        return new NextResponse('Internal Server Error: ' + (error instanceof Error ? error.message : String(error)), { status: 500 })
    }
}
