import { z } from 'zod'

// ============================================
// INTERFAZ BASE PARA TODOS LOS WIZARDS
// ============================================

export interface WizardProps {
  quoteId: string
  initialData?: WizardInitialData
  expressDeliveryPercentage?: number
  exhibitionPercentage?: number
  onComplete: (data: WizardOutputData) => void
  onCancel: () => void
}

export interface WizardInitialData {
  // Datos básicos
  productId?: string
  productName?: string
  width?: number
  height?: number
  quantity?: number
  
  // Opciones del producto
  tone?: string
  toneId?: string
  color?: string
  
  // Configuración
  faces?: number
  isTwoSided?: boolean
  edgeBanding?: string
  cubrecanto?: string
  
  // Jaladera
  handle?: string
  handleModelId?: string
  handlePrice?: number
  handleOrientation?: 'vertical' | 'horizontal'
  jaladera?: string
  jaladeraOrientation?: 'vertical' | 'horizontal'
  vetaOrientation?: 'vertical' | 'horizontal'
  
  // Opciones especiales
  expressShipping?: boolean
  demoProduct?: boolean
  isExpressDelivery?: boolean
  isExhibition?: boolean
  
  // Precios
  unitPrice?: number
  totalPrice?: number
}

export interface WizardOutputData {
  // Requeridos
  quantity: number
  width: number
  height: number
  unitPrice: number
  totalPrice: number
  
  // Opcionales
  productId?: string
  tone?: string
  toneId?: string
  isTwoSided?: boolean
  edgeBanding?: string
  handle?: string
  handleModelId?: string
  handlePrice?: number
  handleOrientation?: string
  expressShipping?: boolean
  demoProduct?: boolean
}

// ============================================
// ESQUEMAS DE VALIDACIÓN (ZOD)
// ============================================

export const WizardInitialDataSchema = z.object({
  productId: z.string().optional(),
  productName: z.string().optional(),
  width: z.number().min(300).max(3000).optional(),
  height: z.number().min(300).max(3000).optional(),
  quantity: z.number().min(1).optional(),
  tone: z.string().optional(),
  toneId: z.string().optional(),
  isTwoSided: z.boolean().optional(),
  edgeBanding: z.string().optional(),
  handle: z.string().optional(),
  handleModelId: z.string().optional(),
  handlePrice: z.number().optional(),
  handleOrientation: z.enum(['vertical', 'horizontal']).optional(),
  expressShipping: z.boolean().optional(),
  demoProduct: z.boolean().optional(),
}).optional()

export const WizardOutputDataSchema = z.object({
  quantity: z.number().min(1),
  width: z.number().min(300).max(3000),
  height: z.number().min(300).max(3000),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  productId: z.string().optional(),
  tone: z.string().optional(),
  toneId: z.string().optional(),
  isTwoSided: z.boolean().optional(),
  edgeBanding: z.string().optional(),
  handle: z.string().optional(),
  handleModelId: z.string().optional(),
  handlePrice: z.number().optional(),
  handleOrientation: z.string().optional(),
  expressShipping: z.boolean().optional(),
  demoProduct: z.boolean().optional(),
})

// ============================================
// TIPOS PARA PASOS DEL WIZARD
// ============================================

export type StepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export interface WizardStep {
  id: StepNumber
  title: string
  description?: string
  isComplete?: boolean
}

export interface WizardState {
  step: StepNumber
  canGoNext: boolean
  canGoBack: boolean
}

// ============================================
// CONSTANTES COMUNES
// ============================================

export const WIZARD_CONSTANTS = {
  // Dimensiones estándar
  MIN_WIDTH: 300,
  MAX_WIDTH: 3000,
  MIN_HEIGHT: 300,
  MAX_HEIGHT: 3000,
  DEFAULT_QUANTITY: 1,
  
  // Porcentajes
  DEFAULT_EXPRESS_PERCENTAGE: 20,
  DEFAULT_EXHIBITION_PERCENTAGE: 25,
  
  // Precios base por m²
  PRECIO_BASE_VATEO: 1998,
  PRECIO_BASE_OTRO: 1500,
  
  // Tiempos de entrega
  DEFAULT_TIEMPO_ENTREGA: 7,
  
  // Tipos de caras
  FACES_OPTIONS: [
    { value: '1', label: '1 Cara' },
    { value: '2', label: '2 Caras' },
  ] as const,
  
  // Orientaciones
  ORIENTATION_OPTIONS: [
    { value: 'vertical', label: 'Vertical' },
    { value: 'horizontal', label: 'Horizontal' },
  ] as const,
  
  // Estados
  STATUS: {
    PENDIENTE: 'Pendiente',
    ENVIADA: 'Enviada',
    APROBADA: 'Aprobada',
    RECHAZADA: 'Rechazada',
  } as const,
}

// ============================================
// FUNCIONES UTILITARIAS COMUNES
// ============================================

export function calculateArea(width: number, height: number): number {
  return (width / 1000) * (height / 1000)
}

export function calculateBasePrice(area: number, pricePerSqm: number = WIZARD_CONSTANTS.PRECIO_BASE_VATEO): number {
  return area * pricePerSqm
}

export function calculateAdjustments(
  subtotal: number,
  expressShipping: boolean = false,
  demoProduct: boolean = false,
  expressPercentage: number = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
  exhibitionPercentage: number = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE
): { expressAmount: number; exhibitionAmount: number; total: number } {
  const expressAmount = expressShipping ? subtotal * (expressPercentage / 100) : 0
  const exhibitionAmount = demoProduct ? subtotal * (exhibitionPercentage / 100) : 0
  const total = subtotal + expressAmount - exhibitionAmount
  
  return { expressAmount, exhibitionAmount, total }
}

export function validateDimension(value: number, min: number, max: number): boolean {
  return value >= min && value <= max
}

export function formatWizardData(data: WizardOutputData): Record<string, unknown> {
  return {
    quantity: data.quantity,
    width: data.width,
    height: data.height,
    unitPrice: data.unitPrice,
    totalPrice: data.totalPrice,
    productId: data.productId,
    isTwoSided: data.isTwoSided,
    edgeBanding: data.edgeBanding,
    handle: data.handle,
    handleModelId: data.handleModelId,
    handlePrice: data.handlePrice,
    handleOrientation: data.handleOrientation,
    expressShipping: data.expressShipping,
    demoProduct: data.demoProduct,
  }
}