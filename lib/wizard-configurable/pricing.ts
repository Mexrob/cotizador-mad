// Pricing calculation engine for configurable wizards

import { PricingConfig, PricingAdjustment, WizardState } from './types'

/**
 * Calcula el precio total basado en la configuración y el estado
 */
export function calculatePricing(
  data: Record<string, unknown>,
  config: PricingConfig
): WizardState['pricing'] {
  // Calcular precio base
  let subtotal = calculateBasePrice(data, config.baseFormula)
  
  // Aplicar ajustes
  const adjustments: WizardState['pricing']['adjustments'] = []
  
  for (const adjustment of config.adjustments || []) {
    if (shouldApplyAdjustment(data, adjustment)) {
      const amount = calculateAdjustment(data, adjustment, subtotal)
      adjustments.push({
        name: adjustment.name,
        amount,
        description: getAdjustmentDescription(adjustment),
      })
      
      // Aplicar al subtotal según el tipo
      switch (adjustment.applyTo) {
        case 'unit':
          subtotal += amount
          break
        case 'total':
          // Se aplica al final
          break
        case 'subtotal':
          subtotal += amount
          break
      }
    }
  }
  
  // Calcular total
  let total = subtotal
  
  // Aplicar ajustes que van al total
  for (const adjustment of adjustments) {
    const adjConfig = config.adjustments?.find((a) => a.name === adjustment.name)
    if (adjConfig?.applyTo === 'total') {
      total += adjustment.amount
    }
  }
  
  // Redondeo
  total = roundPrice(total, config.rounding, config.roundingPrecision)
  
  return {
    subtotal,
    adjustments,
    total,
  }
}

/**
 * Calcula el precio base usando una fórmula
 */
function calculateBasePrice(data: Record<string, unknown>, formula: string): number {
  // Obtener variables del estado
  const width = getNumberValue(data, 'dimensions.width', 0)
  const height = getNumberValue(data, 'dimensions.height', 0)
  const quantity = getNumberValue(data, 'dimensions.quantity', 1)
  let pricePerSquareMeter = getNumberValue(data, 'pricePerSquareMeter', 0)
  const line = getStringValue(data, 'line', '')
  const area = (width / 1000) * (height / 1000) // Convertir mm a m
  
  // Si no hay precio por m², usar precio por defecto según la línea
  if (pricePerSquareMeter === 0 && line) {
    const linePrices: Record<string, number> = {
      'Alto Brillo': 5100,
      'Super Mate': 4940,
      'Línea Alhú': 4440,
      'Europea Básica': 977,
      'Europea Sincro': 1400,
      'Vidrio': 3500,
    }
    pricePerSquareMeter = linePrices[line] || 0
  }
  
  // Evaluar fórmula básica
  switch (formula) {
    case 'glass-calculation':
      return area * pricePerSquareMeter * quantity
    case 'alhu-calculation':
      return area * 4440 * quantity // Precio fijo Alhú
    case 'europea-basica-calculation':
      return area * 977 * quantity
    case 'europea-sincro-calculation':
      return area * 1400 * quantity
    case 'alto-brillo-calculation':
    case 'super-mate-calculation':
      return area * pricePerSquareMeter * quantity
    case 'kit-calculation':
      // Para kits, el precio puede ser fijo o por componente
      return getNumberValue(data, 'kitPrice', 0) * quantity
    default:
      // Intentar evaluar como expresión matemática
      try {
        return evaluateFormula(formula, { width, height, area, quantity, pricePerSquareMeter })
      } catch {
        return area * pricePerSquareMeter * quantity
      }
  }
}

/**
 * Verifica si se debe aplicar un ajuste
 */
function shouldApplyAdjustment(
  data: Record<string, unknown>,
  adjustment: PricingAdjustment
): boolean {
  if (!adjustment.conditions || adjustment.conditions.length === 0) {
    return true
  }
  
  return adjustment.conditions.every((condition) => {
    const { field, operator, value } = condition
    const fieldValue = getNestedValue(data, field)
    
    switch (operator) {
      case 'equals':
        return fieldValue === value
      case 'notEquals':
        return fieldValue !== value
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue)
      default:
        return false
    }
  })
}

/**
 * Calcula el monto de un ajuste
 */
function calculateAdjustment(
  data: Record<string, unknown>,
  adjustment: PricingAdjustment,
  currentSubtotal: number
): number {
  // Evaluar la fórmula del ajuste
  try {
    const variables = {
      ...data,
      subtotal: currentSubtotal,
    }
    return evaluateFormula(adjustment.formula, variables)
  } catch {
    return 0
  }
}

/**
 * Obtiene la descripción de un ajuste
 */
function getAdjustmentDescription(adjustment: PricingAdjustment): string | undefined {
  // Se puede agregar lógica para generar descripciones automáticas
  return undefined
}

/**
 * Redondea un precio según la configuración
 */
function roundPrice(
  price: number,
  method: 'none' | 'up' | 'down' | 'nearest',
  precision: number = 2
): number {
  const multiplier = Math.pow(10, precision)
  
  switch (method) {
    case 'up':
      return Math.ceil(price * multiplier) / multiplier
    case 'down':
      return Math.floor(price * multiplier) / multiplier
    case 'nearest':
      return Math.round(price * multiplier) / multiplier
    case 'none':
    default:
      return price
  }
}

/**
 * Evalúa una fórmula matemática con variables
 */
function evaluateFormula(formula: string, variables: Record<string, unknown>): number {
  // Reemplazar variables con sus valores
  let expression = formula
  
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === 'number') {
      // Escapar puntos en los nombres de variables para regex
      const escapedKey = key.replace(/\./g, '\\.')
      expression = expression.replace(new RegExp(`\\b${escapedKey}\\b`, 'g'), value.toString())
    }
  }
  
  // Validar que la expresión solo contiene caracteres seguros
  const safeExpression = expression.replace(/[^0-9+\-*/().\s]/g, '')
  
  // Evaluar (usando Function constructor para sandbox básico)
  try {
    // eslint-disable-next-line no-new-func
    const result = new Function(`return (${safeExpression})`)()
    return typeof result === 'number' && !isNaN(result) ? result : 0
  } catch {
    return 0
  }
}

/**
 * Obtiene un valor numérico del estado
 */
function getNumberValue(data: Record<string, unknown>, path: string, defaultValue: number = 0): number {
  const value = getNestedValue(data, path)
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseFloat(value) || defaultValue
  return defaultValue
}

/**
 * Obtiene un valor de texto del estado
 */
function getStringValue(data: Record<string, unknown>, path: string, defaultValue: string = ''): string {
  const value = getNestedValue(data, path)
  if (typeof value === 'string') return value
  return defaultValue
}

/**
 * Obtiene un valor anidado del estado
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Calcula el área en metros cuadrados
 */
export function calculateArea(width: number, height: number): number {
  return (width / 1000) * (height / 1000)
}

/**
 * Calcula el precio por metro lineal
 */
export function calculateLinearPrice(length: number, pricePerMeter: number): number {
  return (length / 1000) * pricePerMeter
}

/**
 * Calcula ajustes por opcionales
 */
export function calculateOptionalAdjustments(
  data: Record<string, unknown>,
  config: PricingConfig
): number {
  let adjustment = 0
  
  // Ajuste por exhibición
  if (data['optionals.isExhibition']) {
    adjustment += 0 // O aplicar porcentaje
  }
  
  // Ajuste por express
  if (data['optionals.isExpressDelivery']) {
    adjustment += 0 // O aplicar porcentaje
  }
  
  // Ajuste por dos caras
  if (data['optionals.isTwoFaces']) {
    const twoCarsAdjustment = getNumberValue(data, 'productTone.twoCarsAdjustment', 0)
    adjustment += twoCarsAdjustment
  }
  
  return adjustment
}
