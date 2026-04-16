import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PUT(
    request: Request,
    { params }: { params: { id: string; itemId: string } }
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
                isTwoSided: config.backFace === 'Especialidad',
                edgeBanding: config.edgeBanding,
                ceramicColor: config.color || null,
                isExhibition: config.isExhibition || false,
                isExpressDelivery: config.isExpressDelivery || false,
            },
            include: {
                product: true,
                productLine: true,
                productTone: true,
                handleModel: true,
            }
        })

        // Recalculate quote totals
        // We need to dynamically import this to avoid circular dependencies if any
        const { recalculateQuoteTotals } = await import('@/lib/quoteUtils')
        await recalculateQuoteTotals(params.id)

        return NextResponse.json({
            success: true,
            data: quoteItem
        })
    } catch (error) {
        console.error('Error updating kit item:', error)
        const message = (error as Error).message || 'Unknown error'

        return NextResponse.json({
            success: false,
            error: `Error al actualizar kit: ${message}`
        }, { status: 500 })
    }
}
