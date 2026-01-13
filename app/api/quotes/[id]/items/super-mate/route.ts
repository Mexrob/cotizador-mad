
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// Base prices for Super Mate tones
const SUPER_MATE_PRICES: { [key: string]: number } = {
    'Plata': 2655,
    'Murano': 2655,
    'Petrol': 2655,
    'Calcio': 2655,
    'Terra': 2883,
    'Grays': 2883,
    'Luton': 2883,
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
        console.log('Super Mate config received:', JSON.stringify(config, null, 2))

        // 1. Find ProductLine "Super Mate"
        const productLine = await prisma.productLine.findUnique({
            where: { name: 'Super Mate' }
        })

        if (!productLine) {
            return new NextResponse('Resource not found: Super Mate line not in DB', { status: 404 })
        }

        // 2. Find or Create Base Product
        let product = await prisma.product.findFirst({
            where: {
                name: 'Puerta Super Mate',
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
                    name: 'Puerta Super Mate',
                    description: 'Puerta con acabado Super Mate',
                    sku: 'SUPER-MATE',
                    categoryId: category.id,
                    lineId: productLine.id,
                    basePrice: 2655, // Base price placeholder
                    dimensionUnit: 'mm'
                }
            })
        }

        // 3. Find ProductTone
        const toneName = config.tone
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

        const baseTonePrice = SUPER_MATE_PRICES[toneName] || 2655
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
                edgeBanding: 'Mismo tono de puerta', // Auto-set for Super Mate
                isTwoSided: false,
                isExhibition: optionals.isExhibition,
                isExpressDelivery: optionals.isExpressDelivery,
            }
        })

        // 7. Recalculate Quote Totals
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({ success: true, data: quoteItem })

    } catch (error) {
        console.error('Error creating Super Mate item:', error)
        return new NextResponse('Internal Server Error: ' + (error instanceof Error ? error.message : String(error)), { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string; itemId: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const config = await request.json()
        console.log('Super Mate update config received:', JSON.stringify(config, null, 2))

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

        // Get the price per square meter from the tone
        const pricePerSquareMeter = config.pricing?.pricePerSquareMeter || 0

        // Update the quote item
        const quoteItem = await prisma.quoteItem.update({
            where: { id: params.itemId },
            data: {
                quantity: dimensions.quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                pricePerSquareMeter: pricePerSquareMeter,
                customWidth: dimensions.width,
                customHeight: dimensions.height,
                productToneId: toneId,
                handleModelId: handleId,
                edgeBanding: 'Mismo tono de puerta', // Auto-set for Super Mate
                isTwoSided: false,
                isExhibition: config.optionals?.isExhibition || false,
                isExpressDelivery: config.optionals?.isExpressDelivery || false,
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

        return NextResponse.json({ success: true, data: quoteItem })

    } catch (error) {
        console.error('Error updating Super Mate item:', error)
        return new NextResponse('Internal Server Error: ' + (error instanceof Error ? error.message : String(error)), { status: 500 })
    }
}
