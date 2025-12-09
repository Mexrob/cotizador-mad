// Types for Kit Wizard Configurator

export type Category = 'Puertas' | null
export type Line = 'Vidrio' | 'Cerámica' | null
export type BackFace = 'Blanca' | 'Especialidad' | null
export type EdgeBanding = 'Similar al tono del vidrio' | 'Similar al tono de la cerámica' | 'Tono Aluminio' | null

export interface Dimensions {
    width: number  // Ancho en mm
    height: number // Alto en mm
    quantity: number
}

export interface FrontDimensions {
    width: number  // Ancho frente en mm
    height: number // Alto frente en mm
}

export interface Optionals {
    isExhibition: boolean
    isExpressDelivery: boolean
}

export interface Pricing {
    basePrice: number
    handlePrice: number
    exhibitionFee: number
    expressDeliveryFee: number
    subtotal: number
    total: number
    pricePerSquareMeter: number // Precio base por m² del tono seleccionado
}

export interface WizardState {
    // Paso 1: Categoría
    category: Category

    // Paso 2: Línea
    line: Line

    // Paso 3: Dimensiones
    dimensions: Dimensions
    frontDimensions: FrontDimensions

    // Paso 4: Tono
    tone: string | null

    // Paso 5: Cara Trasera
    backFace: BackFace

    // Paso 6: Cubrecanto
    edgeBanding: EdgeBanding

    // Paso 7: Opcionales
    optionals: Optionals

    // Paso 8: Jaladera
    handle: string | null

    // Precios calculados
    pricing: Pricing

    // Delivery time in business days
    deliveryDays: number

    // Color/tone specific to ceramic brand (only for Cerámica line)
    color?: string | null
}

export const TONES = [
    'Blanco - Brillante',
    'Blanco - Mate',
    'Paja - Brillante',
    'Paja - Mate',
    'Capuchino - Brillante',
    'Capuchino - Mate',
    'Humo - Brillante',
    'Humo - Mate',
    'Gris - Brillante',
    'Gris - Mate',
    'Rojo - Brillante',
    'Rojo - Mate',
    'Negro - Brillante',
    'Negro - Mate',
] as const

export const CERAMIC_TONES = [
    'Dekton',
    'Abk Stone',
    'Xtone',
    'Infinity',
    'Antolini',
    'Lioli',
] as const

// Ceramic colors by brand
export const CERAMIC_COLORS: Record<string, string[]> = {
    'Dekton': [
        'DANAE',
        'KELYA',
        'MORPHEUS',
        'AURA',
        'ANTZO',
        'LAURENT',
        'REM',
        'OLIMPO',
        'ATLANTIS',
        'ESSENCE',
        'LIMESTONE',
    ],
    'Abk Stone': [], // TODO: Add colors
    'Xtone': [], // TODO: Add colors
    'Infinity': [], // TODO: Add colors
    'Antolini': [], // TODO: Add colors
    'Lioli': [], // TODO: Add colors
}

export const TONE_PRICES: Record<string, number> = {
    // Glass tones
    'Blanco - Brillante': 4940.00,
    'Blanco - Mate': 5100.00,
    'Paja - Brillante': 4940.00,
    'Paja - Mate': 5100.00,
    'Capuchino - Brillante': 4940.00,
    'Capuchino - Mate': 5100.00,
    'Humo - Brillante': 4940.00,
    'Humo - Mate': 5100.00,
    'Gris - Brillante': 4940.00,
    'Gris - Mate': 5100.00,
    'Rojo - Brillante': 5100.00,
    'Rojo - Mate': 5200.00,
    'Negro - Brillante': 4940.00,
    'Negro - Mate': 5100.00,
    // Ceramic tones - all same price
    'Dekton': 2600.00,
    'Abk Stone': 2600.00,
    'Xtone': 2600.00,
    'Infinity': 2600.00,
    'Antolini': 2600.00,
    'Lioli': 2600.00,
}

export const HANDLES = [
    'No aplica',
    'Sorento A Negro',
    'Sorento L Negro',
    'Sorento G Negro',
    'Sorento A Aluminio',
    'Sorento L Aluminio',
    'Sorento G Aluminio',
    'Romulo Aluminio',
    'Romulo Negro',
    'Remo Negro',
    'Remo Aluminio',
] as const

export const HANDLE_PRICES: Record<string, number> = {
    'No aplica': 0,
    'Sorento A Negro': 890.00,
    'Sorento L Negro': 890.00,
    'Sorento G Negro': 980.00,
    'Sorento A Aluminio': 890.00,
    'Sorento L Aluminio': 890.00,
    'Sorento G Aluminio': 980.00,
    'Romulo Aluminio': 480.00,
    'Romulo Negro': 480.00,
    'Remo Negro': 480.00,
    'Remo Aluminio': 480.00,
}

export const DIMENSION_LIMITS = {
    vidrio: {
        width: { min: 100, max: 1200 },
        height: { min: 100, max: 2220 },
        frontWidth: { min: 100, max: 1200 },
        frontHeight: { min: 100, max: 2220 },
    },
    ceramica: {
        width: { min: 100, max: 1200 },
        height: { min: 100, max: 2400 },
        frontWidth: { min: 100, max: 1200 },
        frontHeight: { min: 100, max: 2400 },
    }
} as const

export type StepProps = {
    state: WizardState
    updateState: (updates: Partial<WizardState>) => void
    onNext: () => void
    onBack: () => void
    isValid: boolean
}
