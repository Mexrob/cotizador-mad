
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Base prices map for Alto Brillo
const ALTO_BRILLO_PRICES: { [key: string]: number } = {
    'Alaska': 1998,
    'Obsidiana': 2087,
    'Magnesio': 2087,
    'Topacio': 2087
}

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
        console.log('Alto Brillo config received:', JSON.stringify(config, null, 2))

        // 1. Find ProductLine "Alto Brillo"
        const productLine = await prisma.productLine.findUnique({
            where: { name: 'Alto Brillo' }
        })

        if (!productLine) {
            return new NextResponse('Resource not found: Alto Brillo', { status: 404 })
        }

        // 2. Find or Create Base Product
        let product = await prisma.product.findFirst({
            where: {
                name: 'Puerta Alto Brillo',
                lineId: productLine.id
            }
        })

        if (!product) {
            let category = await prisma.category.findFirst({
                where: { name: 'Puertas' }
            })

            if (!category) {
                category = await prisma.category.create({
                    data: { name: 'Puertas', description: 'Puertas personalizadas' }
                })
            }

            product = await prisma.product.create({
                data: {
                    name: 'Puerta Alto Brillo',
                    description: 'Puerta con acabado Alto Brillo',
                    sku: 'ALTO-BRILLO',
                    categoryId: category.id,
                    lineId: productLine.id,
                    basePrice: 1998, // Starting price
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

        const baseTonePrice = ALTO_BRILLO_PRICES[toneName] || 1998
        const basePrice = area * baseTonePrice * dimensions.quantity

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

        // 6. Create Quote Item
        const quoteItem = await prisma.quoteItem.create({
            data: {
                quoteId: params.id,
                productId: product.id,
                productLineId: productLine.id,
                quantity: dimensions.quantity,
                unitPrice: subtotal / dimensions.quantity,
                totalPrice: total,
                pricePerSquareMeter: baseTonePrice,
                customWidth: dimensions.width,
                customHeight: dimensions.height,
                productToneId: toneId,
                handleModelId: handleId,
                edgeBanding: config.edgeBanding,
                isTwoSided: false, // No grain selection for Alto Brillo
                isExhibition: optionals.isExhibition,
                isExpressDelivery: optionals.isExpressDelivery,
            }
        })

        // 7. Recalculate Quote Totals
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({ success: true, data: quoteItem })

    } catch (error) {
        console.error('Error creating Alto Brillo item:', error)
        return new NextResponse('Internal Server Error: ' + (error instanceof Error ? error.message : String(error)), { status: 500 })
    }
}
