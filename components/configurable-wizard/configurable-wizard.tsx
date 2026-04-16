'use client'

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  WizardTemplateConfig,
  WizardStepConfig,
  WizardState,
  StepCondition,
  WizardStepProps,
} from '@/lib/wizard-configurable/types'
import { evaluateCondition } from '@/lib/wizard-configurable/utils'
import { calculatePricing } from '@/lib/wizard-configurable/pricing'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent } from '@/components/ui/card'

// Importar componentes de pasos disponibles
import { StepCategory } from '@/components/wizard-steps/step-category'
import { StepLine } from '@/components/wizard-steps/step-line'
import { StepProduct } from '@/components/wizard-steps/step-product'
import { StepDimensions } from '@/components/wizard-steps/step-dimensions'
import { StepTone } from '@/components/wizard-steps/step-tone'
import { StepGrain } from '@/components/wizard-steps/step-grain'
import { StepBackFace } from '@/components/wizard-steps/step-back-face'
import { StepEdgeBanding } from '@/components/wizard-steps/step-edge-banding'
import { StepHandle } from '@/components/wizard-steps/step-handle'
import { StepOptionals } from '@/components/wizard-steps/step-optionals'
import { StepSummary } from '@/components/wizard-steps/step-summary'
import { StepCustom } from '@/components/wizard-steps/step-custom'
import { StepToneAluminum } from '@/components/wizard-steps/step-tone-aluminum'
import { StepToneGlass } from '@/components/wizard-steps/step-tone-glass'

// Registry de componentes de pasos
const STEP_COMPONENTS: Record<string, React.ComponentType<WizardStepProps>> = {
  'category-selection': StepCategory,
  'line-selection': StepLine,
  'product-selection': StepProduct,
  'dimensions': StepDimensions,
  'tone-selection': StepTone,
  'grain-selection': StepGrain,
  'back-face-selection': StepBackFace,
  'edge-banding-selection': StepEdgeBanding,
  'handle-selection': StepHandle,
  'optionals': StepOptionals,
  'summary': StepSummary,
  'custom': StepCustom,
  'tone-aluminum-selection': StepToneAluminum,
  'tone-glass-selection': StepToneGlass,
}

interface ConfigurableWizardProps {
  templateId?: string
  templateCode?: string
  quoteId?: string
  initialData?: Record<string, unknown>
  onComplete: (data: WizardState['data'], pricing: WizardState['pricing']) => void
  onCancel?: () => void
}

export function ConfigurableWizard({
  templateId,
  templateCode,
  quoteId,
  initialData,
  onComplete,
  onCancel,
}: ConfigurableWizardProps) {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<WizardTemplateConfig | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [state, setState] = useState<WizardState>({
    currentStep: 0,
    data: initialData || {},
    items: [], // Inicializar lista de partidas
    history: [],
    isValid: false,
    errors: {},
    pricing: {
      subtotal: 0,
      adjustments: [],
      total: 0,
    },
  })

  // Cargar configuración del template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (templateId) params.set('id', templateId)
        if (templateCode) params.set('code', templateCode)

        const response = await fetch(`/api/wizard-templates/get-config?${params}`)
        const result = await response.json()

        if (result.success) {
          setConfig(result.data.config)
          setTemplateName(result.data.name)
        } else {
          toast.error('Error al cargar configuración del wizard')
        }
      } catch (error) {
        console.error('Error loading wizard template:', error)
        toast.error('Error al cargar configuración del wizard')
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [templateId, templateCode])

  // Filtrar pasos activos basados en condiciones
  const activeSteps = useMemo(() => {
    if (!config) return []
    
    return config.steps
      .filter((step) => step.isEnabled)
      .filter((step) => {
        // Evaluar condiciones para mostrar el paso
        if (!step.conditions || step.conditions.length === 0) return true
        return step.conditions.every((condition) =>
          evaluateCondition(condition, state.data)
        )
      })
      .sort((a, b) => a.order - b.order)
  }, [config, state.data])

  // Verificar si se debe saltar el paso actual
  const shouldSkipStep = useCallback(
    (step: WizardStepConfig) => {
      if (!step.skipConditions || step.skipConditions.length === 0) return false
      return step.skipConditions.every((condition) =>
        evaluateCondition(condition, state.data)
      )
    },
    [state.data]
  )

  // Función auxiliar para obtener valores de campos anidados
  const getNestedValue = (data: Record<string, unknown>, path: string): unknown => {
    const keys = path.split('.')
    let value: unknown = data
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key]
      } else {
        return undefined
      }
    }
    return value
  }

  // Validar paso actual
  const validateCurrentStep = useCallback(() => {
    if (!config) return false
    
    const currentStepConfig = activeSteps[state.currentStep]
    if (!currentStepConfig) return false

    // Validaciones específicas según el tipo de paso
    const errors: Record<string, string> = {}
    let isValid = true

    // Validar campos requeridos
    if (currentStepConfig.isRequired) {
      const requiredFields = getRequiredFieldsForStep(currentStepConfig)
      for (const field of requiredFields) {
        const value = getNestedValue(state.data, field)
        
        // Manejar valores numéricos (0 es válido pero no para dimensiones vacías)
        if (typeof value === 'number') {
          if (value === 0 || isNaN(value)) {
            errors[field] = 'Este campo es requerido'
            isValid = false
          }
        } else if (value === undefined || value === null || value === '') {
          errors[field] = 'Este campo es requerido'
          isValid = false
        }
      }
    }

    // Aplicar reglas de validación personalizadas
    const stepValidation = config.validation?.rules.find(
      (rule) => rule.stepId === currentStepConfig.id
    )
    if (stepValidation) {
      for (const rule of stepValidation.rules) {
        const fieldValue = state.data[stepValidation.field]
        const fieldError = validateField(fieldValue, rule)
        if (fieldError) {
          errors[stepValidation.field] = fieldError
          isValid = false
        }
      }
    }

    setState((prev) => ({ ...prev, isValid, errors }))
    return isValid
  }, [config, activeSteps, state.currentStep, state.data])

  // Actualizar estado
  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => {
      const newState = { ...prev, ...updates }
      
      // Recalcular precios si cambiaron datos relevantes
      if (updates.data && config?.pricing) {
        newState.pricing = calculatePricing(newState.data, config.pricing)
      }
      
      return newState
    })
  }, [config])

  // Validar automáticamente cuando cambian los datos
  useEffect(() => {
    if (config && activeSteps.length > 0) {
      validateCurrentStep()
    }
  }, [state.data, state.currentStep, config, activeSteps, validateCurrentStep])

  // Navegación
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      toast.error('Por favor completa todos los campos requeridos')
      return
    }

    const currentStepConfig = activeSteps[state.currentStep]
    
    // Guardar en historial
    setState((prev) => ({
      ...prev,
      history: [...prev.history, currentStepConfig.id],
    }))

    // Buscar siguiente paso
    let nextIndex = state.currentStep + 1
    while (nextIndex < activeSteps.length) {
      const nextStep = activeSteps[nextIndex]
      if (!shouldSkipStep(nextStep)) break
      nextIndex++
    }

    if (nextIndex < activeSteps.length) {
      setState((prev) => ({ ...prev, currentStep: nextIndex, isValid: false }))
    } else {
      // Completar wizard: Enviar datos al padre (onComplete) para que los guarde en la BD
      onComplete(state.data, state.pricing)
      
      // Resetear estado interno del wizard
      setState((prev) => ({
        ...prev,
        data: {}, 
        currentStep: 0,
        history: [],
        isValid: false,
        pricing: { subtotal: 0, adjustments: [], total: 0 }
      }))
      toast.success('Partida configurada correctamente.')
    }
  }, [activeSteps, state.currentStep, state.data, state.pricing, validateCurrentStep, shouldSkipStep, onComplete])

  const handleBack = useCallback(() => {
    if (state.currentStep > 0) {
      // Volver al paso anterior en el historial
      const prevHistory = [...state.history]
      prevHistory.pop()
      const prevStepId = prevHistory[prevHistory.length - 1]
      const prevIndex = activeSteps.findIndex((s) => s.id === prevStepId)
      
      setState((prev) => ({
        ...prev,
        currentStep: prevIndex >= 0 ? prevIndex : 0,
        history: prevHistory,
        isValid: true,
      }))
    }
  }, [activeSteps, state.currentStep, state.history])

  const handleSkip = useCallback(() => {
    const currentStepConfig = activeSteps[state.currentStep]
    if (!currentStepConfig.isRequired) {
      handleNext()
    }
  }, [activeSteps, state.currentStep, handleNext])

  // Renderizar paso actual
  const renderCurrentStep = () => {
    if (!config || activeSteps.length === 0) return null

    const currentStepConfig = activeSteps[state.currentStep]
    const StepComponent = STEP_COMPONENTS[currentStepConfig.stepDefinitionCode]

    if (!StepComponent) {
      return (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Componente no encontrado: {currentStepConfig.stepDefinitionCode}
          </p>
        </div>
      )
    }

    return (
      <StepComponent
        config={currentStepConfig}
        state={state}
        updateState={updateState}
        onNext={handleNext}
        onBack={handleBack}
        onSkip={handleSkip}
        isValid={state.isValid}
        errors={state.errors}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Cargando configuración...</span>
      </div>
    )
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No se pudo cargar la configuración del wizard
        </p>
      </div>
    )
  }

  const currentStepConfig = activeSteps[state.currentStep]
  const progress = ((state.currentStep + 1) / activeSteps.length) * 100

  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-bold mb-2">{templateName}</h1>
        {config.ui?.texts?.description && (
          <p className="text-muted-foreground text-sm">{config.ui.texts.description}</p>
        )}
      </div>

      {/* Progress Bar */}
      {config.ui?.layout?.showProgressBar !== false && (
        <div className="shrink-0 mb-4">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>
              Paso {state.currentStep + 1} de {activeSteps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Step Content - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                {renderCurrentStep()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4 shrink-0 pt-4 border-t">
        <div>
          {state.currentStep > 0 && config.ui?.layout?.allowBack !== false && (
            <Button variant="outline" onClick={handleBack}>
              {config.ui?.texts?.buttonLabels?.back || 'Atrás'}
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="ml-2">
              Cancelar
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {!currentStepConfig?.isRequired && config.ui?.layout?.allowSkip && (
            <Button variant="outline" onClick={handleSkip}>
              Saltar
            </Button>
          )}
          <Button onClick={handleNext} disabled={!state.isValid}>
            {state.currentStep === activeSteps.length - 1
              ? config.ui?.texts?.buttonLabels?.finish || 'Finalizar'
              : config.ui?.texts?.buttonLabels?.next || 'Siguiente'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function getRequiredFieldsForStep(step: WizardStepConfig): string[] {
  // Campos requeridos según el tipo de paso
  const fieldMap: Record<string, string[]> = {
    'category-selection': ['category'],
    'line-selection': ['line'],
    'dimensions': ['dimensions.width', 'dimensions.height'],
    'tone-selection': ['tone'],
    'handle-selection': step.config.required ? ['handle'] : [],
  }
  
  return fieldMap[step.stepDefinitionCode] || []
}

function validateField(value: unknown, rule: { type: string; value?: unknown; message: string }): string | null {
  switch (rule.type) {
    case 'required':
      if (value === undefined || value === null || value === '') {
        return rule.message
      }
      break
    case 'min':
      if (typeof value === 'number' && typeof rule.value === 'number') {
        if (value < rule.value) return rule.message
      }
      break
    case 'max':
      if (typeof value === 'number' && typeof rule.value === 'number') {
        if (value > rule.value) return rule.message
      }
      break
    case 'range':
      if (typeof value === 'number' && Array.isArray(rule.value)) {
        const [min, max] = rule.value
        if (value < min || value > max) return rule.message
      }
      break
    case 'regex':
      if (typeof value === 'string' && typeof rule.value === 'string') {
        const regex = new RegExp(rule.value)
        if (!regex.test(value)) return rule.message
      }
      break
  }
  return null
}
