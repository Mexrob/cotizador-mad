import { describe, it, expect } from 'vitest';
import { calculateUnitPrice, calculateQuoteTotals } from './pricing';
import { UserRole } from '@/lib/types';

describe('Pricing Logic', () => {
  describe('calculateUnitPrice', () => {
    const mockProduct = {
      id: 'prod-1',
      name: 'Test Product',
      basePrice: 100,
      isCustomizable: false,
      width: 1000,
      height: 1000,
      pricing: [],
    } as any;

    it('should return base price for non-customizable products without role specific pricing', () => {
      const price = calculateUnitPrice(mockProduct, UserRole.RETAIL);
      expect(price).toBe(100);
    });

    it('should return role specific pricing if available', () => {
      const productWithRolePricing = {
        ...mockProduct,
        pricing: [{ userRole: UserRole.ADMIN, finalPrice: 80 }],
      };
      const price = calculateUnitPrice(productWithRolePricing, UserRole.ADMIN);
      expect(price).toBe(80);
    });

    it('should calculate price based on dimensions for customizable products', () => {
      const customizableProduct = {
        ...mockProduct,
        isCustomizable: true,
        basePrice: 1000, // $1000 for 1m x 1m (1m2)
      };
      
      // If we ask for 0.5m x 0.5m (0.25m2), price should be $250
      const price = calculateUnitPrice(customizableProduct, UserRole.RETAIL, 500, 500);
      expect(price).toBe(250);
    });

    it('should handle role pricing with customization', () => {
      const customizableProduct = {
        ...mockProduct,
        isCustomizable: true,
        pricing: [{ userRole: UserRole.ADMIN, finalPrice: 800 }], // $800 for 1m2
      };
      
      // 0.5m x 0.5m = 0.25m2. 25% of $800 = $200
      const price = calculateUnitPrice(customizableProduct, UserRole.ADMIN, 500, 500);
      expect(price).toBe(200);
    });
  });

  describe('calculateQuoteTotals', () => {
    it('should calculate totals correctly with IVA (16%)', () => {
      const items = [
        { unitPrice: 100, quantity: 2 }, // 200
        { unitPrice: 50, quantity: 4 },  // 200
      ] as any;

      const totals = calculateQuoteTotals(items, 0);
      
      expect(totals.subtotal).toBe(400);
      expect(totals.taxAmount).toBe(64); // 400 * 0.16
      expect(totals.totalAmount).toBe(464);
    });

    it('should apply discount correctly', () => {
      const items = [{ unitPrice: 100, quantity: 1 }] as any;
      const totals = calculateQuoteTotals(items, 10);
      
      expect(totals.subtotal).toBe(100);
      expect(totals.taxAmount).toBe(16);
      expect(totals.totalAmount).toBe(100 + 16 - 10); // 106
    });
  });
});
