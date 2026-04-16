import { describe, it, expect } from 'vitest';
import { productSchema, quoteSchema } from './validationSchemas';

describe('Validation Schemas', () => {
  describe('productSchema', () => {
    it('should validate a valid product', () => {
      const validProduct = {
        name: 'Test Product',
        precioBaseM2: 1500,
        tiempoEntrega: 7,
      };
      
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should fail if name is missing', () => {
      const invalidProduct = {
        precioBaseM2: 1500,
      };
      
      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('El nombre es requerido');
      }
    });

    it('should validate dimension limits if provided', () => {
      const productWithDimensions = {
        name: 'Door 1',
        puertaAnchoMin: 400,
        puertaAnchoMax: 1000,
      };
      
      const result = productSchema.safeParse(productWithDimensions);
      expect(result.success).toBe(true);
    });

    it('should fail if precioBaseM2 is negative', () => {
      const invalidProduct = {
        name: 'Bad Price',
        precioBaseM2: -10,
      };
      
      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });
});

describe('quoteSchema', () => {
  it('should validate a valid quote', () => {
    const validQuote = {
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      projectName: 'Cocina Moderna',
    };
    const result = quoteSchema.safeParse(validQuote);
    expect(result.success).toBe(true);
  });

  it('should fail if customerName is empty', () => {
    const invalidQuote = {
      customerName: '',
      customerEmail: 'juan@example.com',
      projectName: 'Cocina Moderna',
    };
    const result = quoteSchema.safeParse(invalidQuote);
    expect(result.success).toBe(false);
  });

  it('should fail if email is invalid', () => {
    const invalidQuote = {
      customerName: 'Juan Pérez',
      customerEmail: 'not-an-email',
      projectName: 'Cocina Moderna',
    };
    const result = quoteSchema.safeParse(invalidQuote);
    expect(result.success).toBe(false);
  });

  it('should allow optional fields', () => {
    const quoteWithOptionals = {
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      projectName: 'Cocina Moderna',
      customerPhone: '1234567890',
      notes: 'Llamar antes de entregar',
    };
    const result = quoteSchema.safeParse(quoteWithOptionals);
    expect(result.success).toBe(true);
  });
});
