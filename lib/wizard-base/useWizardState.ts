/**
 * useWizardState - Hook personalizado para lógica estándar de wizards
 * 
 * Proporciona:
 * - Estado común (step, loading, restored)
 * - Funciones de navegación (canProceed, handleNext, handleBack)
 * - Restauración de datos desde initialData
 * - Cálculos comunes
 * 
 * Usage:
 * const {
 *   state,
 *   setState,
 *   canGoNext,
 *   canGoBack,
 *   goToStep,
 *   goNext,
 *   goBack,
 *   calculateTotal,
 * } = useWizardState({
 *   initialData,
 *   maxSteps: 7,
 *   onValidateStep,
 * })
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  WizardState,
  WizardInitialData,
  calculateArea,
  calculateAdjustments,
  WIZARD_CONSTANTS
} from './types'

interface UseWizardStateOptions<T extends WizardState> {
  initialData?: WizardInitialData
  maxSteps: number
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  onValidateStep?: (step: number, state: T) => boolean
  expressDeliveryPercentage?: number
  exhibitionPercentage?: number
}

interface UseWizardStateReturn<T extends WizardState> {
  // Estado
  state: T
  setState: React.Dispatch<React.SetStateAction<T>>
  
  // Navegación
  currentStep: number
  canGoNext: boolean
  canGoBack: boolean
  isFirstStep: boolean
  isLastStep: boolean
  goToStep: (step: number) => void
  goNext: () => void
  goBack: () => void
  
  // Validación
  validateDimensions: (width: number, height: number) => boolean
  
  // Cálculos
  calculateTotal: (subtotal: number) => number
  calculateArea: (width: number, height: number) => number
  
  // Estado de carga
  restored: boolean
  loading: boolean
}

export function useWizardState<T extends WizardState>(
  options: UseWizardStateOptions<T>
): UseWizardStateReturn<T> {
  const {
    initialData,
    maxSteps,
    minWidth = WIZARD_CONSTANTS.MIN_WIDTH,
    maxWidth = WIZARD_CONSTANTS.MAX_WIDTH,
    minHeight = WIZARD_CONSTANTS.MIN_HEIGHT,
    maxHeight = WIZARD_CONSTANTS.MAX_HEIGHT,
    onValidateStep,
    expressDeliveryPercentage = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
    exhibitionPercentage = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE,
  } = options

  const [state, setState] = useState<T>({} as T)
  const [restored, setRestored] = useState(false)
  const [loading, setLoading] = useState(true)

  const currentStep = (state as any).step || 1
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === maxSteps

  // Validar si puede avanzar
  const canGoNext = useCallback(() => {
    if (!onValidateStep) return true
    return onValidateStep(currentStep, state)
  }, [currentStep, state, onValidateStep])

  // Validar si puede retroceder
  const canGoBack = useCallback(() => {
    return currentStep > 1
  }, [currentStep])

  // Ir a un paso específico
  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= maxSteps) {
      setState((prev: any) => ({ ...prev, step }))
    }
  }, [maxSteps])

  // Ir al siguiente paso
  const goNext = useCallback(() => {
    if (canGoNext() && !isLastStep) {
      setState((prev: any) => ({ 
        ...prev, 
        step: (Math.min(currentStep + 1, maxSteps)) as any 
      }))
    }
  }, [canGoNext, currentStep, maxSteps, isLastStep])

  // Ir al paso anterior
  const goBack = useCallback(() => {
    if (canGoBack() && !isFirstStep) {
      setState((prev: any) => ({ 
        ...prev, 
        step: (Math.max(currentStep - 1, 1)) as any 
      }))
    }
  }, [canGoBack, currentStep, isFirstStep])

  // Validar dimensiones
  const validateDimensions = useCallback((width: number, height: number) => {
    return (
      width >= minWidth && 
      width <= maxWidth && 
      height >= minHeight && 
      height <= maxHeight
    )
  }, [minWidth, maxWidth, minHeight, maxHeight])

  // Calcular área
  const calculateAreaFn = useCallback((width: number, height: number) => {
    return calculateArea(width, height)
  }, [])

  // Calcular total con ajustes
  const calculateTotal = useCallback((subtotal: number) => {
    const { expressShipping, demoProduct } = (state as any).specialOptions || {}
    const { total } = calculateAdjustments(
      subtotal,
      expressShipping,
      demoProduct,
      expressDeliveryPercentage,
      exhibitionPercentage
    )
    return total
  }, [state, expressDeliveryPercentage, exhibitionPercentage])

  // Efecto para restaurar datos iniciales
  useEffect(() => {
    if (!loading && initialData && !restored) {
      setRestored(true)
      // Restaurar lógica según cada wizard
    }
  }, [loading, initialData, restored])

  return {
    state,
    setState: setState as any,
    currentStep,
    canGoNext: canGoNext(),
    canGoBack: canGoBack(),
    isFirstStep,
    isLastStep,
    goToStep,
    goNext,
    goBack,
    validateDimensions,
    calculateTotal,
    calculateArea: calculateAreaFn,
    restored,
    loading,
  }
}