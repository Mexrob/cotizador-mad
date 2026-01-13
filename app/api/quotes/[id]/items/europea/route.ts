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
        console.log('Europea Básica config received:', JSON.stringify(config, null, 2))

        // 1. Find ProductLine "Europea Básica"
        const productLine = await prisma.productLine.findUnique({
            where: { name: 'Europea Básica' }
        })

        if (!productLine) {
            return NextResponse.json(
                { success: false, error: 'No se encontró la línea de producto "Europea Básica"' },
                { status: 404 }
            )
        }

        // 2. Find or create base product for Europea Básica
        let product = await prisma.product.findFirst({
            where: { lineId: productLine.id }
        })

        if (!product) {
            // Find or create a category
            let category = await prisma.category.findFirst({
                where: { name: 'Puertas' }
            })

            if (!category) {
                category = await prisma.category.create({
                    data: { name: 'Puertas', description: 'Puertas personalizadas' }
                })
            }

            // Create a basic product if it doesn't exist
            product = await prisma.product.create({
                data: {
                    name: 'Puerta Europea Básica',
                    sku: 'EUROPEA-KIT',
                    categoryId: category.id,
                    lineId: productLine.id,
                    basePrice: 977,
                    isCustomizable: true,
                }
            })
        }

        // 3. Find Tone (stored in config.tone)
        let toneId = null
        if (config.tone) {
            const tone = await prisma.productTone.findFirst({
                where: {
                    lineId: productLine.id,
                    name: config.tone
                }
            })
            toneId = tone?.id || null
        }

        // 4. Find Handle
        let handleId = null
        if (config.handle && config.handle !== 'No aplica') {
            const handle = await prisma.handleModel.findUnique({
                where: { name: config.handle }
            })
            handleId = handle?.id || null
        }

        // 5. Calculate Pricing
        const { dimensions, optionals } = config
        const EUROPEA_PRICE = 977
        const area = (dimensions.width / 1000) * (dimensions.height / 1000)
        const baseItemPrice = area * EUROPEA_PRICE * dimensions.quantity

        // Handle Price
        let handlePrice = 0
        if (handleId) {
            const handleModel = await prisma.handleModel.findUnique({
                where: { id: handleId }
            })
            if (handleModel && handleModel.price != null) {
                handlePrice = Number(handleModel.price) * dimensions.quantity
            }
        }

        const subtotal = baseItemPrice + handlePrice

        // Optionals
        const exhibitionFee = optionals.isExhibition ? subtotal * -0.25 : 0
        const expressFee = optionals.isExpressDelivery ? subtotal * 0.20 : 0

        const total = subtotal + exhibitionFee + expressFee

        // 6. Create Quote Item
        const quoteItem = await prisma.quoteItem.create({
            data: {
                quoteId: params.id,
                productId: product.id,
                productLineId: productLine.id,
                quantity: dimensions.quantity,
                unitPrice: subtotal / dimensions.quantity,
                totalPrice: total,
                pricePerSquareMeter: EUROPEA_PRICE,
                customWidth: dimensions.width,
                customHeight: dimensions.height,
                productToneId: toneId,
                handleModelId: handleId,
                edgeBanding: config.edgeBanding, // "Mismo tono de puerta"
                isTwoSided: config.backFace === 'Horizontal' || config.backFace === 'Vertical', // Grain direction stored in backFace
                isExhibition: optionals.isExhibition,
                isExpressDelivery: optionals.isExpressDelivery,
            }
        })

        // 7. Recalculate quote totals
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({ success: true, data: quoteItem })

    } catch (error) {
        console.error('Error creating Europea Básica item:', error)
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            error
        })
        return NextResponse.json(
            {
                success: false,
                error: 'Error interno del servidor',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}
