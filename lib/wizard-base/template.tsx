/**
 * WIZARD TEMPLATE - Plantilla base para normalizar todos los wizards
 * 
 * Este archivo sirve como referencia para crear wizards consistentes.
 * Copiar y adaptar según las necesidades de cada línea.
 * 
 * @see lib/wizard-base/types.ts para tipos completos
 * @see lib/wizard-base/components.tsx para componentes UI
 * @see lib/wizard-base/useWizardState.ts para hook de estado
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Check, ChevronLeft, ChevronRight, Package, Ruler, 
  ListChecks, FileText, Palette, Layers 
} from 'lucide-react'

// Importar componentes comunes
import { 
  WizardProgressBar,
  WizardNavigation,
  WizardStepContainer,
  WizardOptionCard,
  WizardSummaryItem 
} from '@/lib/wizard-base/components'

// Importar tipos y utilities
import { 
  WizardInitialData,
  WIZARD_CONSTANTS,
  calculateArea,
  calculateAdjustments 
} from '@/lib/wizard-base/types'

// ============================================
// INTERFAZ ESPECÍFICA DEL WIZARD
// ============================================

// Definir pasos específicos del wizard
const STEPS = [
  { id: 1, title: 'Tono' },
  { id: 2, title: 'Dimensiones' },
  { id: 3, title: 'Caras' },
  { id: 4, title: 'Cubrecanto' },
  { id: 5, title: 'Jaladera' },
  { id: 6, title: 'Opciones' },
  { id: 7, title: 'Resumen' },
] as const

// Opciones específicas del wizard
const TONE_OPTIONS = [
  { name: 'Alaska', price: 1998 },
  { name: 'Obsidiana', price: 1998 },
  { name: 'Magnesio', price: 1998 },
  { name: 'Topacio', price: 1998 }
]

const CUBRECANTO_OPTIONS = [
  { value: 'Mismo tono de puerta', label: 'Mismo tono de puerta' }
]

const HANDLE_OPTIONS = [
  { name: 'No aplica', price: '0' },
  { name: 'Sorento A Negro', price: '890' }
]

// ============================================
// INTERFAZ DEL COMPONENTE
// ============================================

interface NombreWizardWizardProps {
  quoteId: string
  initialData?: WizardInitialData
  expressDeliveryPercentage?: number
  exhibitionPercentage?: number
  onComplete: (data: any) => void
  onCancel: () => void
}

// ============================================
// ESTADO DEL WIZARD
// ============================================

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface WizardState {
  step: Step
  tone: string
  dimensions: {
    width: number
    height: number
    quantity: number
  }
  options: {
    faces: '1' | '2'
    cubrecanto: string
    jaladera: string
    jaladeraOrientation: 'vertical' | 'horizontal'
  }
  specialOptions: {
    expressShipping: boolean
    demoProduct: boolean
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function NombreWizard({
  quoteId,
  initialData,
  expressDeliveryPercentage = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
  exhibitionPercentage = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE,
  onComplete,
  onCancel
}: NombreWizardWizardProps) {
  
  // ------------------------------------------
  // ESTADO INICIAL
  // ------------------------------------------
  
  const [state, setState] = useState<WizardState>({
    step: 1,
    tone: initialData?.tone || '',
    dimensions: {
      width: initialData?.width || 0,
      height: initialData?.height || 0,
      quantity: initialData?.quantity || 1
    },
    options: {
      faces: initialData?.isTwoSided ? '2' : '1',
      cubrecanto: initialData?.edgeBanding || 'Mismo tono de puerta',
      jaladera: initialData?.handle || 'No aplica',
      jaladeraOrientation: initialData?.handleOrientation as any || 'vertical'
    },
    specialOptions: {
      expressShipping: initialData?.expressShipping || false,
      demoProduct: initialData?.demoProduct || false
    }
  })

  const [restored, setRestored] = useState(false)

  // ------------------------------------------
  // RESTAURACIÓN DE DATOS (al editar)
  // ------------------------------------------
  
  useEffect(() => {
    if (initialData && !restored) {
      setRestored(true)
      setState(prev => ({
        ...prev,
        tone: initialData.tone || prev.tone,
        dimensions: {
          width: initialData.width || prev.dimensions.width,
          height: initialData.height || prev.dimensions.height,
          quantity: initialData.quantity || prev.dimensions.quantity
        },
        options: {
          faces: initialData.isTwoSided ? '2' : '1',
          cubrecanto: initialData.edgeBanding || 'Mismo tono de puerta',
          jaladera: initialData.handle || 'No aplica',
          jaladeraOrientation: initialData.handleOrientation as any || 'vertical'
        },
        specialOptions: {
          expressShipping: initialData.expressShipping || false,
          demoProduct: initialData.demoProduct || false
        }
      }))
    }
  }, [initialData, restored])

  // ------------------------------------------
  // FUNCIONES DE CÁLCULO
  // ------------------------------------------
  
  const calculateSubtotal = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const basePrice = 1998 // precio por m²
    return basePrice * area * state.dimensions.quantity
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const { total } = calculateAdjustments(
      subtotal,
      state.specialOptions.expressShipping,
      state.specialOptions.demoProduct,
      expressDeliveryPercentage,
      exhibitionPercentage
    )
    return total
  }

  // ------------------------------------------
  // NAVEGACIÓN
  // ------------------------------------------
  
  const canGoNext = () => {
    switch (state.step) {
      case 1: return !!state.tone
      case 2: return state.dimensions.width > 0 && state.dimensions.height > 0
      case 3: return !!state.options.faces
      case 4: return !!state.options.cubrecanto
      case 5: return !!state.options.jaladera
      case 6: return true
      default: return true
    }
  }

  const handleNext = () => {
    if (canGoNext() && state.step < 7) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as Step }))
    }
  }

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as Step }))
    }
  }

  const handleFinish = () => {
    onComplete({
      tone: state.tone,
      width: state.dimensions.width,
      height: state.dimensions.height,
      quantity: state.dimensions.quantity,
      isTwoSided: state.options.faces === '2',
      edgeBanding: state.options.cubrecanto,
      handle: state.options.jaladera,
      handleOrientation: state.options.jaladeraOrientation,
      expressShipping: state.specialOptions.expressShipping,
      demoProduct: state.specialOptions.demoProduct,
      unitPrice: calculateSubtotal() / state.dimensions.quantity,
      totalPrice: calculateTotal()
    })
  }

  // ------------------------------------------
  // RENDER DE PASOS
  // ------------------------------------------
  
  const renderStep = () => {
    switch (state.step) {
      case 1: return renderToneStep()
      case 2: return renderDimensionsStep()
      case 3: return renderFacesStep()
      case 4: return renderCubrecantoStep()
      case 5: return renderHandleStep()
      case 6: return renderOptionsStep()
      case 7: return renderSummaryStep()
      default: return null
    }
  }

  // --- Paso 1: Tono ---
  const renderToneStep = () => (
    <WizardStepContainer title="Selección de Tono / Color" icon={Palette}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {TONE_OPTIONS.map((tone) => (
          <WizardOptionCard
            key={tone.name}
            selected={state.tone === tone.name}
            onClick={() => setState(prev => ({ ...prev, tone: tone.name }))}
          >
            <div className="text-center">
              <h4 className="font-semibold">{tone.name}</h4>
              <p className="text-sm text-green-600">${tone.price}/m²</p>
            </div>
          </WizardOptionCard>
        ))}
      </div>
    </WizardStepContainer>
  )

  // --- Paso 2: Dimensiones ---
  const renderDimensionsStep = () => (
    <WizardStepContainer title="Dimensiones y cantidad" icon={Ruler}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="width">Ancho (mm)</Label>
          <Input
            id="width"
            type="number"
            value={state.dimensions.width || ''}
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              dimensions: { ...prev.dimensions, width: Number(e.target.value) }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="height">Alto (mm)</Label>
          <Input
            id="height"
            type="number"
            value={state.dimensions.height || ''}
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              dimensions: { ...prev.dimensions, height: Number(e.target.value) }
            }))}
          />
        </div>
        <div>
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            value={state.dimensions.quantity || ''}
            onChange={(e) => setState(prev => ({ 
              ...prev, 
              dimensions: { ...prev.dimensions, quantity: Number(e.target.value) }
            }))}
          />
        </div>
      </div>
    </WizardStepContainer>
  )

  // --- Paso 3: Caras ---
  const renderFacesStep = () => (
    <WizardStepContainer title="Caras" icon={Layers}>
      <RadioGroup
        value={state.options.faces}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, faces: v as '1' | '2' }
        }))}
      >
        {WIZARD_CONSTANTS.FACES_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`faces-${opt.value}`} />
            <Label htmlFor={`faces-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 4: Cubrecanto ---
  const renderCubrecantoStep = () => (
    <WizardStepContainer title="Cubrecanto" icon={ListChecks}>
      <RadioGroup
        value={state.options.cubrecanto}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, cubrecanto: v }
        }))}
      >
        {CUBRECANTO_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.value} id={`cubrecanto-${opt.value}`} />
            <Label htmlFor={`cubrecanto-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 5: Jaladera ---
  const renderHandleStep = () => (
    <WizardStepContainer title="Jaladera" icon={Package}>
      <RadioGroup
        value={state.options.jaladera}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, jaladera: v }
        }))}
      >
        {HANDLE_OPTIONS.map((opt) => (
          <div key={opt.name} className="flex items-center space-x-2">
            <RadioGroupItem value={opt.name} id={`handle-${opt.name}`} />
            <Label htmlFor={`handle-${opt.name}`}>{opt.name}</Label>
          </div>
        ))}
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 6: Opciones ---
  const renderOptionsStep = () => (
    <WizardStepContainer title="Opciones" icon={ListChecks}>
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="express"
            checked={state.specialOptions.expressShipping}
            onCheckedChange={(c) => setState(prev => ({ 
              ...prev, 
              specialOptions: { ...prev.specialOptions, expressShipping: !!c }
            }))}
          />
          <Label htmlFor="express">Envío express (+{expressDeliveryPercentage}%)</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="exhibition"
            checked={state.specialOptions.demoProduct}
            onCheckedChange={(c) => setState(prev => ({ 
              ...prev, 
              specialOptions: { ...prev.specialOptions, demoProduct: !!c }
            }))}
          />
          <Label htmlFor="exhibition">Producto exhibición (-{exhibitionPercentage}%)</Label>
        </div>
      </div>
    </WizardStepContainer>
  )

  // --- Paso 7: Resumen ---
  const renderSummaryStep = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    
    return (
      <WizardStepContainer title="Resumen de Configuración" icon={FileText}>
        <div className="bg-gray-50 rounded-lg p-6 space-y-3 max-w-lg mx-auto">
          <WizardSummaryItem label="Tono" value={state.tone} />
          <WizardSummaryItem 
            label="Dimensiones" 
            value={`${state.dimensions.width} x ${state.dimensions.height} mm`} 
          />
          <WizardSummaryItem label="Cantidad" value={state.dimensions.quantity} />
          <WizardSummaryItem label="Área" value={`${area.toFixed(3)} m²`} />
          <WizardSummaryItem label="Caras" value={state.options.faces} />
          <WizardSummaryItem label="Cubrecanto" value={state.options.cubrecanto} />
          <WizardSummaryItem label="Jaladera" value={state.options.jaladera} />
          <WizardSummaryItem label="Tiempo de entrega" value="7 días" />
          <WizardSummaryItem label="Subtotal" value={`$${calculateSubtotal().toFixed(2)}`} isTotal />
        </div>
      </WizardStepContainer>
    )
  }

  // ------------------------------------------
  // RENDER PRINCIPAL
  // ------------------------------------------
  
  return (
    <div className="flex flex-col h-[480px]">
      {/* Barra de progreso */}
      <WizardProgressBar 
        currentStep={state.step} 
        totalSteps={7}
      />
      
      {/* Contenido del paso */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
      
      {/* Navegación */}
      <WizardNavigation
        canGoBack={state.step > 1}
        canGoNext={canGoNext()}
        isLastStep={state.step === 7}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
        finishLabel="Agregar a Cotización"
        variant="green"
      />
    </div>
  )
}