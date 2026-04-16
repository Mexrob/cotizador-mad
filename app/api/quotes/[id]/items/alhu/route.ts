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
        console.log('Alhú config received:', JSON.stringify(config, null, 2))

        // 1. Find ProductLine "Línea Alhú"
        const productLine = await prisma.productLine.findUnique({
            where: { name: 'Línea Alhú' }
        })

        if (!productLine) {
            return NextResponse.json(
                { success: false, error: 'No se encontró la línea de producto "Línea Alhú"' },
                { status: 404 }
            )
        }

        // 2. Find or create base product for Alhú
        let product = await prisma.product.findFirst({
            where: { linea: productLine.id }
        })

        if (!product) {
            // Find or create a category for Alhú
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
                    name: 'Puerta Línea Alhú',
                    categoryId: category.id,
                    linea: productLine.id,
                    precioBaseM2: 4440,
                }
            })
        }

        // Validate tiempo de entrega - prevent mixing different delivery times
        const existingItems = await prisma.quoteItem.findMany({
            where: { quoteId: params.id },
            include: { product: { select: { tiempoEntrega: true } } }
        })
        const existingTiempoEntrega = existingItems[0]?.product?.tiempoEntrega
        if (existingItems.length > 0 && existingTiempoEntrega !== product.tiempoEntrega) {
            return NextResponse.json(
                { success: false, error: `Error en el tiempo de entrega. Esta cotización tiene productos con ${existingTiempoEntrega} días. Solo puedes agregar productos con el mismo tiempo de entrega.` },
                { status: 400 }
            )
        }

        // 3. Find Glass Tone (stored in config.tone)
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
        const ALHU_GLASS_PRICE = 4440
        const area = (dimensions.width / 1000) * (dimensions.height / 1000)
        const baseItemPrice = area * ALHU_GLASS_PRICE * dimensions.quantity

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

        // Get company settings for dynamic percentages
        const companySettings = await prisma.companySettings.findFirst()
        const expressPercentage = companySettings?.expressDeliveryPercentage || 20
        const exhibitionPercentage = companySettings?.exhibitionPercentage || 25

        // Optionals - using dynamic percentages from company settings
        const expressFee = optionals.isExpressDelivery ? subtotal * (expressPercentage / 100) : 0
        const exhibitionFee = optionals.isExhibition ? subtotal * (exhibitionPercentage / 100) : 0

        const total = subtotal + expressFee - exhibitionFee

        // 6. Create Quote Item
        const quoteItem = await prisma.quoteItem.create({
            data: {
                quoteId: params.id,
                productId: product.id,
                productLineId: productLine.id,
                quantity: dimensions.quantity,
                unitPrice: subtotal / dimensions.quantity,
                totalPrice: total,
                pricePerSquareMeter: ALHU_GLASS_PRICE,
                customWidth: dimensions.width,
                customHeight: dimensions.height,
                productToneId: toneId,
                handleModelId: handleId,
                edgeBanding: config.edgeBanding, // Aluminum Tone stored here
                isExhibition: optionals.isExhibition,
                isExpressDelivery: optionals.isExpressDelivery,
                isTwoSided: false,
                expressAmount: expressFee,
                exhibitionAmount: exhibitionFee,
            }
        })

        // 7. Recalculate quote totals
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({ success: true, data: quoteItem })

    } catch (error) {
        console.error('Error creating Alhú item:', error)
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
