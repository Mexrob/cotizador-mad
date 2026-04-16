// Configurable Wizard System Types

import { UserRole } from '@prisma/client'

// ==================== Wizard Configuration Types ====================

export interface WizardTemplateConfig {
  steps: WizardStepConfig[]
  pricing: PricingConfig
  validation: ValidationConfig
  ui?: UIConfig
}

export interface WizardStepConfig {
  id: string
  stepDefinitionCode: string // Referencia a WizardStepDefinition.code
  order: number
  isRequired: boolean
  isEnabled: boolean
  config: Record<string, unknown> // Configuración específica del paso
  conditions?: StepCondition[] // Condiciones para mostrar este paso
  skipConditions?: StepCondition[] // Condiciones para saltar este paso
}

export interface StepCondition {
  field: string // Campo del estado a evaluar (ej: "line", "category")
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'exists' | 'gt' | 'lt'
  value: unknown
}

export interface PricingConfig {
  baseFormula: string // Código de PricingFormula.code
  adjustments: PricingAdjustment[]
  rounding: 'none' | 'up' | 'down' | 'nearest'
  roundingPrecision?: number // Decimal places
}

export interface PricingAdjustment {
  name: string
  formula: string
  conditions?: StepCondition[]
  applyTo: 'unit' | 'total' | 'subtotal'
}

export interface ValidationConfig {
  rules: ValidationRule[]
}

export interface ValidationRule {
  stepId: string
  field: string
  rules: FieldValidation[]
}

export interface FieldValidation {
  type: 'required' | 'min' | 'max' | 'range' | 'regex' | 'custom'
  value?: unknown
  message: string
  customFunction?: string // Para validaciones complejas
}

export interface UIConfig {
  theme?: {
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
  }
  texts?: {
    title?: string
    description?: string
    stepLabels?: Record<string, string>
    buttonLabels?: {
      next?: string
      back?: string
      finish?: string
    }
  }
  layout?: {
    showProgressBar?: boolean
    showStepNumbers?: boolean
    allowSkip?: boolean
    allowBack?: boolean
  }
}

// ==================== Wizard State Types ====================

export interface WizardState {
  currentStep: number
  data: Record<string, unknown>
  items: Array<Record<string, unknown>> // Array de partidas (productos configurados)
  history: string[] // IDs de pasos visitados
  isValid: boolean
  errors: Record<string, string>
  pricing: {
    subtotal: number
    adjustments: PricingAdjustmentResult[]
    total: number
  }
}

export interface PricingAdjustmentResult {
  name: string
  amount: number
  description?: string
}

// ==================== Step Component Types ====================

export interface WizardStepProps {
  config: WizardStepConfig
  state: WizardState
  updateState: (updates: Partial<WizardState>) => void
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  isValid: boolean
  errors: Record<string, string>
}

export interface StepDefinition {
  code: string
  name: string
  component: React.ComponentType<WizardStepProps>
  description?: string
  icon?: string
  validate?: (state: WizardState, config: WizardStepConfig) => boolean
  calculatePricing?: (state: WizardState, config: WizardStepConfig) => number
}

// ==================== API Types ====================

export interface CreateWizardTemplateRequest {
  name: string
  description?: string
  code: string
  stepsConfig: WizardStepConfig[]
  pricingConfig?: PricingConfig
  validationRules?: ValidationConfig
  uiConfig?: UIConfig
  isDefault?: boolean
}

export interface UpdateWizardTemplateRequest {
  name?: string
  description?: string
  stepsConfig?: WizardStepConfig[]
  pricingConfig?: PricingConfig
  validationRules?: ValidationConfig
  uiConfig?: UIConfig
  isActive?: boolean
  isDefault?: boolean
}

export interface AssignWizardRequest {
  templateId: string
  userId?: string
  role?: UserRole
  priority?: number
  validFrom?: string
  validUntil?: string
}

export interface WizardAssignmentResponse {
  id: string
  templateId: string
  templateName: string
  userId?: string
  role?: UserRole
  priority: number
  validFrom?: string
  validUntil?: string
}

// ==================== Step Definitions Registry ====================

export type StepComponentType =
  | 'category-selection'
  | 'line-selection'
  | 'product-selection'
  | 'dimensions'
  | 'tone-selection'
  | 'color-selection'
  | 'grain-selection'
  | 'back-face-selection'
  | 'edge-banding-selection'
  | 'handle-selection'
  | 'optionals'
  | 'summary'
  | 'custom'
  | 'tone-aluminum-selection'
  | 'tone-glass-selection'

export interface StepDefinitionMetadata {
  code: StepComponentType
  name: string
  description: string
  icon: string
  category: 'system' | 'product' | 'pricing' | 'custom'
  configurableFields: ConfigurableField[]
  outputs: string[] // Campos que este paso agrega al estado
}

export interface ConfigurableField {
  name: string
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'json'
  label: string
  description?: string
  required: boolean
  defaultValue?: unknown
  options?: { label: string; value: string }[]
}

// Registry de definiciones de pasos disponibles
export const AVAILABLE_STEP_DEFINITIONS: StepDefinitionMetadata[] = [
  {
    code: 'category-selection',
    name: 'Selección de Categoría',
    description: 'Permite al usuario seleccionar la categoría del producto',
    icon: 'LayoutGrid',
    category: 'system',
    configurableFields: [
      {
        name: 'categories',
        type: 'multiselect',
        label: 'Categorías disponibles',
        required: true,
        options: [
          { label: 'Puertas', value: 'doors' },
          { label: 'Cajones', value: 'drawers' },
          { label: 'Accesorios', value: 'accessories' },
        ],
      },
    ],
    outputs: ['category'],
  },
  {
    code: 'line-selection',
    name: 'Selección de Línea',
    description: 'Selección de la línea de producto',
    icon: 'Layers',
    category: 'product',
    configurableFields: [
      {
        name: 'filterByCategory',
        type: 'boolean',
        label: 'Filtrar por categoría seleccionada',
        required: false,
        defaultValue: true,
      },
    ],
    outputs: ['line', 'lineId'],
  },
  {
    code: 'product-selection',
    name: 'Selección de Productos',
    description: 'Permite seleccionar productos del catálogo',
    icon: 'Package',
    category: 'product',
    configurableFields: [
      {
        name: 'filterByCategory',
        type: 'boolean',
        label: 'Filtrar por categoría seleccionada',
        required: false,
        defaultValue: false,
      },
      {
        name: 'allowMultiple',
        type: 'boolean',
        label: 'Permitir selección múltiple',
        required: false,
        defaultValue: true,
      },
    ],
    outputs: ['productIds', 'selectedProducts'],
  },
  {
    code: 'dimensions',
    name: 'Dimensiones',
    description: 'Configuración de dimensiones del producto',
    icon: 'Ruler',
    category: 'product',
    configurableFields: [
      {
        name: 'minWidth',
        type: 'number',
        label: 'Ancho mínimo (mm)',
        required: true,
        defaultValue: 100,
      },
      {
        name: 'maxWidth',
        type: 'number',
        label: 'Ancho máximo (mm)',
        required: true,
        defaultValue: 2400,
      },
      {
        name: 'minHeight',
        type: 'number',
        label: 'Alto mínimo (mm)',
        required: true,
        defaultValue: 100,
      },
      {
        name: 'maxHeight',
        type: 'number',
        label: 'Alto máximo (mm)',
        required: true,
        defaultValue: 2700,
      },
      {
        name: 'allowQuantity',
        type: 'boolean',
        label: 'Permitir cantidad',
        required: false,
        defaultValue: true,
      },
    ],
    outputs: ['dimensions.width', 'dimensions.height', 'dimensions.quantity'],
  },
  {
    code: 'tone-selection',
    name: 'Selección de Tono',
    description: 'Selección del tono/color del producto',
    icon: 'Palette',
    category: 'product',
    configurableFields: [
      {
        name: 'filterByLine',
        type: 'boolean',
        label: 'Filtrar por línea seleccionada',
        required: false,
        defaultValue: true,
      },
      {
        name: 'showPrices',
        type: 'boolean',
        label: 'Mostrar precios',
        required: false,
        defaultValue: false,
      },
    ],
    outputs: ['tone', 'toneId', 'pricePerSquareMeter'],
  },
  {
    code: 'grain-selection',
    name: 'Dirección de Veta',
    description: 'Selección de la dirección de la veta (horizontal/vertical)',
    icon: 'ArrowUpDown',
    category: 'product',
    configurableFields: [],
    outputs: ['grain', 'grainDirection'],
  },
  {
    code: 'back-face-selection',
    name: 'Cara Trasera',
    description: 'Selección del tipo de cara trasera',
    icon: 'Square',
    category: 'product',
    configurableFields: [
      {
        name: 'allowTwoSided',
        type: 'boolean',
        label: 'Permitir opción "Dos Caras"',
        required: false,
        defaultValue: true,
      },
    ],
    outputs: ['backFace', 'isTwoSided'],
  },
  {
    code: 'edge-banding-selection',
    name: 'Cubrecanto',
    description: 'Selección del tipo de cubrecanto',
    icon: 'Combine',
    category: 'product',
    configurableFields: [
      {
        name: 'autoSelect',
        type: 'boolean',
        label: 'Seleccionar automáticamente',
        required: false,
        defaultValue: false,
      },
    ],
    outputs: ['edgeBanding', 'edgeBandingId'],
  },
  {
    code: 'tone-aluminum-selection',
    name: 'Tono Aluminio',
    description: 'Selección del tono de aluminio',
    icon: 'Palette',
    category: 'product',
    configurableFields: [
      {
        name: 'options',
        type: 'multiselect',
        label: 'Opciones disponibles',
        required: true,
        options: [
          { label: 'Natural', value: 'Natural' },
          { label: 'Negro', value: 'Negro' },
          { label: 'Champagne', value: 'Champagne' },
        ],
      },
    ],
    outputs: ['toneAluminum', 'toneAluminumId'],
  },
  {
    code: 'tone-glass-selection',
    name: 'Tono Vidrio',
    description: 'Selección del tono de vidrio',
    icon: 'Palette',
    category: 'product',
    configurableFields: [
      {
        name: 'options',
        type: 'multiselect',
        label: 'Opciones disponibles',
        required: true,
        options: [
          { label: 'Natural', value: 'Natural' },
          { label: 'Ahumado Claro', value: 'Ahumado Claro' },
          { label: 'Bronce texturizado con 1 capa de pintura', value: 'Bronce texturizado con 1 capa de pintura' },
          { label: 'Espejo bronce de 6mm', value: 'Espejo bronce de 6mm' },
          { label: 'Tela encapsulada en vidrio ultraclaro de 4+4', value: 'Tela encapsulada en vidrio ultraclaro de 4+4' },
          { label: 'Tela encapsulada en vidrio claro de 4+4', value: 'Tela encapsulada en vidrio claro de 4+4' },
          { label: 'Espejo claro Anticado de 6mm', value: 'Espejo claro Anticado de 6mm' },
          { label: 'Filtrasol Texturizado de 6mm', value: 'Filtrasol Texturizado de 6mm' },
          { label: 'Vidrio claro texturizado de 6mm con pintura', value: 'Vidrio claro texturizado de 6mm con pintura' },
          { label: 'Vidrio Cristazul texturizado de 6mm', value: 'Vidrio Cristazul texturizado de 6mm' },
        ],
      },
    ],
    outputs: ['toneGlass', 'toneGlassId', 'pricePerSquareMeter'],
  },
  {
    code: 'handle-selection',
    name: 'Jaladera',
    description: 'Selección del modelo de jaladera',
    icon: 'GripHorizontal',
    category: 'product',
    configurableFields: [
      {
        name: 'filterByLine',
        type: 'boolean',
        label: 'Filtrar compatibles por línea',
        required: false,
        defaultValue: true,
      },
      {
        name: 'required',
        type: 'boolean',
        label: 'Campo obligatorio',
        required: false,
        defaultValue: false,
      },
    ],
    outputs: ['handle', 'handleId', 'handlePrice'],
  },
  {
    code: 'optionals',
    name: 'Opcionales',
    description: 'Configuración de opciones adicionales',
    icon: 'Settings',
    category: 'pricing',
    configurableFields: [
      {
        name: 'showExhibition',
        type: 'boolean',
        label: 'Mostrar opción Exhibición',
        required: false,
        defaultValue: true,
      },
      {
        name: 'showExpress',
        type: 'boolean',
        label: 'Mostrar opción Express',
        required: false,
        defaultValue: true,
      },
      {
        name: 'showTwoSided',
        type: 'boolean',
        label: 'Mostrar opción Dos Caras',
        required: false,
        defaultValue: true,
      },
    ],
    outputs: ['optionals.isExhibition', 'optionals.isExpressDelivery', 'optionals.isTwoFaces'],
  },
  {
    code: 'summary',
    name: 'Resumen',
    description: 'Resumen final antes de guardar',
    icon: 'FileText',
    category: 'system',
    configurableFields: [
      {
        name: 'showPricing',
        type: 'boolean',
        label: 'Mostrar desglose de precios',
        required: false,
        defaultValue: true,
      },
      {
        name: 'allowEdit',
        type: 'boolean',
        label: 'Permitir editar pasos anteriores',
        required: false,
        defaultValue: true,
      },
    ],
    outputs: [],
  },
  {
    code: 'custom',
    name: 'Paso Personalizado',
    description: 'Paso completamente personalizable',
    icon: 'Wand2',
    category: 'custom',
    configurableFields: [
      {
        name: 'title',
        type: 'text',
        label: 'Título del paso',
        required: true,
      },
      {
        name: 'description',
        type: 'text',
        label: 'Descripción',
        required: false,
      },
      {
        name: 'fields',
        type: 'json',
        label: 'Definición de campos (JSON)',
        required: true,
        description: 'Definición de los campos a mostrar en este paso',
      },
    ],
    outputs: ['custom.*'],
  },
]
