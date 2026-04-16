import { prisma } from './db'

/**
 * Recalculates and updates the totals for a quote based on its items
 * @param quoteId - The ID of the quote to recalculate
 * @returns The updated quote with new totals
 */
export async function recalculateQuoteTotals(quoteId: string) {
    // Get all items for this quote
    const items = await prisma.quoteItem.findMany({
        where: { quoteId },
    })

    // Calculate subtotal from all items
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0)

    // Calculate tax (16%)
    const taxAmount = subtotal * 0.16

    // Get current discount
    const currentQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        select: { discountAmount: true },
    })

    const discountAmount = currentQuote?.discountAmount || 0

    // Calculate total
    const totalAmount = subtotal + taxAmount - discountAmount

    // Update the quote with new totals
    const updatedQuote = await prisma.quote.update({
        where: { id: quoteId },
        data: {
            subtotal,
            taxAmount,
            totalAmount,
        },
    })

    return updatedQuote
}
