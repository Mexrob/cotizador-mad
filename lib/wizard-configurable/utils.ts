// Utility functions for configurable wizard system

import { StepCondition, StepDefinitionMetadata, AVAILABLE_STEP_DEFINITIONS } from './types'

interface DbWizardStepDefinition {
  id: string
  name: string
  code: string
  componentName: string
  componentPath: string
  description: string | null
  icon: string | null
  isSystem: boolean
  configSchema: unknown | null
  defaultConfig: unknown | null
  stepType: string
  createdAt: Date
  updatedAt: Date
}

function dbStepToMetadata(dbStep: DbWizardStepDefinition): StepDefinitionMetadata {
  return {
    code: dbStep.code as StepDefinitionMetadata['code'],
    name: dbStep.name,
    description: dbStep.description || '',
    icon: dbStep.icon || 'Settings',
    category: dbStep.isSystem ? 'system' : 'custom',
    configurableFields: [],
    outputs: [],
  }
}

export async function getStepDefinitions(): Promise<StepDefinitionMetadata[]> {
  const systemSteps = AVAILABLE_STEP_DEFINITIONS

  try {
    const res = await fetch('/api/wizard-step-definitions', {
      next: { revalidate: 60 },
    })
    const data = await res.json()

    if (data.success && data.data) {
      const dbSteps = data.data as DbWizardStepDefinition[]
      const dbStepsMetadata = dbSteps.map(dbStepToMetadata)
      
      const dbStepCodes = new Set(dbStepsMetadata.map(s => s.code))
      const filteredSystemSteps = systemSteps.filter(s => !dbStepCodes.has(s.code))
      
      return [...dbStepsMetadata, ...filteredSystemSteps]
    }

    return systemSteps
  } catch (error) {
    console.error('Error fetching step definitions from DB:', error)
    return systemSteps
  }
}

/**
 * Evalúa una condición contra el estado actual del wizard
 */
export function evaluateCondition(
  condition: StepCondition,
  data: Record<string, unknown>
): boolean {
  const { field, operator, value } = condition
  const fieldValue = getNestedValue(data, field)

  switch (operator) {
    case 'equals':
      return fieldValue === value
    case 'notEquals':
      return fieldValue !== value
    case 'in':
      if (Array.isArray(value)) {
        return value.includes(fieldValue)
      }
      return false
    case 'notIn':
      if (Array.isArray(value)) {
        return !value.includes(fieldValue)
      }
      return true
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null
    case 'gt':
      if (typeof fieldValue === 'number' && typeof value === 'number') {
        return fieldValue > value
      }
      return false
    case 'lt':
      if (typeof fieldValue === 'number' && typeof value === 'number') {
        return fieldValue < value
      }
      return false
    default:
      return false
  }
}

/**
 * Obtiene un valor anidado de un objeto usando notación de punto
 * Ej: getNestedValue({ a: { b: 1 } }, 'a.b') => 1
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Establece un valor anidado en un objeto usando notación de punto
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const keys = path.split('.')
  const result = { ...obj }
  let current: Record<string, unknown> = result

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key] as Record<string, unknown>
  }

  current[keys[keys.length - 1]] = value
  return result
}

/**
 * Valida un objeto de configuración de wizard
 */
export function validateWizardConfig(config: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config || typeof config !== 'object') {
    return { valid: false, errors: ['Config must be an object'] }
  }

  const cfg = config as Record<string, unknown>

  // Validar steps
  if (!cfg.steps || !Array.isArray(cfg.steps)) {
    errors.push('steps must be an array')
  } else {
    cfg.steps.forEach((step, index) => {
      if (!step.id) errors.push(`Step ${index}: id is required`)
      if (!step.stepDefinitionCode) errors.push(`Step ${index}: stepDefinitionCode is required`)
      if (typeof step.order !== 'number') errors.push(`Step ${index}: order must be a number`)
    })
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Genera un ID único para pasos
 */
export function generateStepId(): string {
  return `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Ordena pasos por su propiedad order
 */
export function sortStepsByOrder<T extends { order: number }>(steps: T[]): T[] {
  return [...steps].sort((a, b) => a.order - b.order)
}

/**
 * Calcula el progreso del wizard
 */
export function calculateProgress(currentStep: number, totalSteps: number): number {
  if (totalSteps === 0) return 0
  return Math.min(100, Math.round(((currentStep + 1) / totalSteps) * 100))
}

/**
 * Formatea un precio para mostrar
 */
export function formatPrice(price: number, currency: string = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(price)
}

/**
 * Deep clone de un objeto
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Compara dos objetos para detectar cambios
 */
export function hasChanges(obj1: unknown, obj2: unknown): boolean {
  return JSON.stringify(obj1) !== JSON.stringify(obj2)
}
