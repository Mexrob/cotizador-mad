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
                product: true,
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
