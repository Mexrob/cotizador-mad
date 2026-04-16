
'use client';

import { formatNumber, formatArea } from '@/lib/utils'; // Import formatting functions

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, Ruler, DollarSign, ShoppingCart, AlertCircle } from 'lucide-react';
import { calculateDimensionPrice, validateDimension, convertToMM } from '@/lib/utils'; // Removed duplicate formatArea import
import { toast } from 'sonner';

/**
 * Props for the DimensionCalculator component.
 * @param basePrice The base price per square millimeter.
 * @param productName The name of the product.
 * @param productId The ID of the product.
 * @param currency The currency to display (default is 'MXN').
 * @param onAddToQuote A callback function to add the calculated item to a quote.
 * @param className Additional CSS classes to apply to the component.
 */
interface DimensionCalculatorProps {
  basePrice: number; // Price per mm²
  productName: string;
  productId?: string;
  currency?: string;
  onAddToQuote?: (data: {
    productId: string;
    quantity: number;
    customWidth: number;
    customHeight: number;
    calculatedPrice: number;
    area: number;
    totalPrice: number;
  }) => void;
  className?: string;
}

interface CalculationResult {
  quantity: number;
  width: number;
  height: number;
  area: number;
  unitPrice: number;
  totalPrice: number;
  formattedUnitPrice: string;
  formattedTotalPrice: string;
  formattedArea: string;
  isValid: boolean;
}

export default function DimensionCalculator({
  basePrice,
  productName,
  productId,
  currency = 'MXN',
  onAddToQuote,
  className = ''
}: DimensionCalculatorProps) {
  const [quantity, setQuantity] = useState<string>('1');
  const [width, setWidth] = useState<string>('1000');
  const [height, setHeight] = useState<string>('900');
  const [calculation, setCalculation] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Recalculate when inputs change
  useEffect(() => {
    calculatePrice();
  }, [quantity, width, height, basePrice]);

  const calculatePrice = () => {
    setIsCalculating(true);

    // Validate inputs
    const quantityNum = parseFloat(quantity) || 0;
    const widthNum = parseFloat(width) || 0;
    const heightNum = parseFloat(height) || 0;

    const isQuantityValid = quantityNum > 0 && quantityNum <= 1000; // Max 1000 units
    const isWidthValid = validateDimension(widthNum, 10, 50000); // 10mm to 50m
    const isHeightValid = validateDimension(heightNum, 10, 50000);

    if (!isQuantityValid || !isWidthValid || !isHeightValid || basePrice <= 0) {
      setCalculation({
        quantity: quantityNum,
        width: widthNum,
        height: heightNum,
        area: 0,
        unitPrice: 0,
        totalPrice: 0,
        formattedUnitPrice: formatNumber(0, currency), // Use utility function
        formattedTotalPrice: formatNumber(0, currency), // Use utility function
        formattedArea: formatArea(0), // Use utility function
        isValid: false
      });
      setIsCalculating(false);
      return;
    }

    // Calculate using the new formula: cantidad × alto × ancho × precio_base
    const area = widthNum * heightNum; // area in mm²
    const unitPrice = area * basePrice; // price per unit
    const totalPrice = quantityNum * unitPrice; // total price

    setCalculation({
      quantity: quantityNum,
      width: widthNum,
      height: heightNum,
      area: area,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      formattedUnitPrice: formatNumber(unitPrice, currency), // Use utility function
      formattedTotalPrice: formatNumber(totalPrice, currency), // Use utility function
      formattedArea: formatArea(area), // Use utility function
      isValid: true
    });

    setIsCalculating(false);
  };

  const handleAddToQuote = () => {
    if (!calculation?.isValid || !productId || !onAddToQuote) {
      toast.error('No se puede agregar a la cotización');
      return;
    }

    onAddToQuote({
      productId,
      quantity: calculation.quantity,
      customWidth: calculation.width,
      customHeight: calculation.height,
      calculatedPrice: calculation.unitPrice,
      area: calculation.area,
      totalPrice: calculation.totalPrice
    });

    toast.success(`${productName} agregado: ${calculation.quantity} unidad(es) con dimensiones personalizadas`);
  };

  /**
   * Validates if an input value is within the specified range for dimensions.
   * @param value The input string to validate.
   * @param min The minimum allowed value.
   * @param max The maximum allowed value.
   * @returns True if the input is valid, false otherwise.
   */
  const isValidInput = (value: string, min: number = 10, max: number = 50000) => {
    const num = parseFloat(value) || 0;
    return validateDimension(num, min, max);
  };

  /**
   * Validates if an input value is a valid integer within the specified range for quantity.
   * @param value The input string to validate.
   * @param min The minimum allowed value.
   * @param max The maximum allowed value.
   * @returns True if the input is valid, false otherwise.
   */
  const isValidQuantity = (value: string, min: number = 1, max: number = 1000) => {
    const num = parseFloat(value) || 0;
    return num >= min && num <= max && Number.isInteger(num);
  };

  return (
    <Card className={`bg-white/90 backdrop-blur-sm border-0 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-module-black" />
          Agregar Producto a la Cotización
        </CardTitle>
        <p className="text-sm text-gray-600">
          Ingresa la cantidad, ancho y alto para obtener el precio total al instante
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calc-quantity" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Cantidad
            </Label>
            <Input
              id="calc-quantity"
              type="number"
              min="1"
              max="1000"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={!isValidQuantity(quantity) ? 'border-red-300 focus:border-red-500' : ''}
              placeholder="1"
            />
            {!isValidQuantity(quantity) && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Entre 1 y 1,000 unidades
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="calc-width" className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Ancho (mm)
            </Label>
            <Input
              id="calc-width"
              type="number"
              min="10"
              max="50000"
              step="1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              className={!isValidInput(width) ? 'border-red-300 focus:border-red-500' : ''}
              placeholder="1000"
            />
            {!isValidInput(width) && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Entre 10mm y 50,000mm
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="calc-height" className="flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Alto (mm)
            </Label>
            <Input
              id="calc-height"
              type="number"
              min="10"
              max="50000"
              step="1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className={!isValidInput(height) ? 'border-red-300 focus:border-red-500' : ''}
              placeholder="900"
            />
            {!isValidInput(height) && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Entre 10mm y 50,000mm
              </p>
            )}
          </div>
        </div>

        {/* Calculation Preview */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Cantidad:</span>
            <span className="font-medium">
              {quantity || '0'} unidad(es)
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Dimensiones:</span>
            <span className="font-medium">
              {width || '0'} × {height || '0'} mm
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Área por unidad:</span>
            <span className="font-medium">
              {calculation?.formattedArea || '0 mm²'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Precio base:</span>
            <span className="font-medium">
              ${basePrice.toFixed(2)} {currency} por mm²
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Precio por unidad:</span>
            <span className="font-medium text-module-black">
              {calculation?.formattedUnitPrice || '$0.00 MXN'}
            </span>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Precio Total:</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-module-black">
                {calculation?.formattedTotalPrice || '$0.00 MXN'}
              </div>
              {calculation?.isValid && (
                <Badge variant="secondary" className="text-xs">
                  Cálculo automático
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Fórmula de Cálculo:</h4>
          <p className="text-sm text-gray-800">
            <strong>Precio Total = Cantidad × Ancho × Alto × Precio Base</strong>
          </p>
          <p className="text-xs text-module-black mt-1">
            Ejemplo: {quantity || '1'} × {width || '1000'}mm × {height || '900'}mm × {basePrice.toFixed(2)} = {calculation?.formattedTotalPrice || '$0.00 MXN'}
          </p>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>• Precio por unidad = {width || '1000'} × {height || '900'} × {basePrice.toFixed(2)} = {calculation?.formattedUnitPrice || '$0.00 MXN'}</p>
            <p>• Precio total = {quantity || '1'} unidades × {calculation?.formattedUnitPrice || '$0.00 MXN'} = {calculation?.formattedTotalPrice || '$0.00 MXN'}</p>
          </div>
        </div>

        {/* Action Button */}
        {onAddToQuote && productId && (
          <Button
            onClick={handleAddToQuote}
            className="w-full h-12 text-lg bg-module-black hover:bg-module-dark"
            disabled={!calculation?.isValid || isCalculating}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Agregar con Estas Dimensiones
          </Button>
        )}

        {/* Common Sizes */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Tamaños Comunes:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { w: 600, h: 700, label: 'Pequeño' },
              { w: 800, h: 900, label: 'Mediano' },
              { w: 1000, h: 900, label: 'Estándar' },
              { w: 1200, h: 1000, label: 'Grande' }
            ].map((size) => (
              <Button
                key={`${size.w}x${size.h}`}
                variant="outline"
                size="sm"
                onClick={() => {
                  setWidth(size.w.toString());
                  setHeight(size.h.toString());
                }}
                className="h-auto py-2 px-3 text-xs"
              >
                <div className="text-center">
                  <div className="font-medium">{size.label}</div>
                  <div className="text-gray-500">{size.w}×{size.h}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
