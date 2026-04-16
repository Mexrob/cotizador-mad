import { UserRole, Product, QuoteItem, ProductPricing } from '@/lib/types';

// Extend the Product type to ensure it includes the 'pricing' relation when fetched
interface ProductWithPricing extends Product {
  pricing?: ProductPricing[];
}

// Extend the QuoteItem type to ensure it includes the 'product' relation when fetched
interface QuoteItemWithProduct extends QuoteItem {
  product: ProductWithPricing;
}

/**
 * Calculates the unit price of a product based on its type (customizable or not) and user role pricing.
 * For customizable products, it calculates the price per square meter and then applies it to the given dimensions.
 *
 * @param product The product object, potentially including user-role specific pricing.
 * @param userRole The role of the user.
 * @param customWidth Optional custom width in mm for customizable products.
 * @param customHeight Optional custom height in mm for customizable products.
 * @returns The calculated unit price.
 */
export function calculateUnitPrice(
  product: ProductWithPricing,
  userRole: UserRole,
  customWidth?: number | null,
  customHeight?: number | null
): number {
  let basePrice = 0;

  // Prioritize user-role specific pricing
  const rolePricing = product.pricing?.find(p => p.userRole === userRole);
  if (rolePricing) {
    basePrice = rolePricing.finalPrice;
  } else {
    // Fallback to product's basePrice if no specific role pricing
    basePrice = product.basePrice || 0;
  }

  if (product.isCustomizable && customWidth && customHeight && product.width && product.height) {
    // Calculate standard area in m² from product's default dimensions
    const standardAreaM2 = (product.width / 1000) * (product.height / 1000);

    // Calculate custom area in m² from provided custom dimensions
    const customAreaM2 = (customWidth / 1000) * (customHeight / 1000);

    if (standardAreaM2 > 0) {
      // Calculate price per square meter based on the product's standard price and dimensions
      const pricePerSquareMeter = basePrice / standardAreaM2;
      // Apply price per square meter to custom dimensions
      return customAreaM2 * pricePerSquareMeter;
    }
  }

  // For non-customizable products or if dimensions are missing/invalid, return the base price directly
  return basePrice;
}

/**
 * Calculates the total amounts for a quote (subtotal, tax, total) based on its items.
 *
 * @param items An array of quote items, including product details.
 * @param discountAmount The total discount to apply to the quote.
 * @returns An object containing subtotal, taxAmount, and totalAmount.
 */
export function calculateQuoteTotals(
  items: QuoteItemWithProduct[],
  discountAmount: number = 0
) {
  let subtotal = 0;

  for (const item of items) {
    // Ensure item.unitPrice is used as it should already be calculated based on product and custom dimensions
    subtotal += item.unitPrice * item.quantity;
  }
 
  // Define tax rate as a constant for better maintainability
  const TAX_RATE = 0.16; // 16% IVA
  const taxAmount = subtotal * TAX_RATE;
  const totalAmount = subtotal + taxAmount - discountAmount;
 
  return {
    subtotal,
    taxAmount,
    totalAmount,
  };
}