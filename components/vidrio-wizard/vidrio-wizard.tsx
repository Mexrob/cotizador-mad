'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatMXN } from '@/lib/utils'
import { Check, ChevronLeft, ChevronRight, Package, Ruler, ListChecks, FileText, Palette } from 'lucide-react'

// Componentes normalizados
import { 
  WizardProgressBar,
  WizardNavigation,
  WizardStepContainer,
  WizardOptionCard,
  WizardSummaryItem 
} from '@/lib/wizard-base/components'

// Tipos y utilities
import { 
  WizardInitialData,
  WIZARD_CONSTANTS,
  calculateArea,
  calculateAdjustments 
} from '@/lib/wizard-base/types'

// ============================================
// INTERFAZ DEL COMPONENTE
// ============================================

interface VidrioWizardProps {
  quoteId: string
  initialData?: WizardInitialData
  expressDeliveryPercentage?: number
  exhibitionPercentage?: number
  onComplete: (data: any) => void
  onCancel: () => void
}

interface Product {
  id: string
  name: string
  precioBaseM2: number
  tonoVidrio: string | null
}

interface WizardState {
  step: 1 | 2 | 3 | 4
  selectedProduct: Product | null
  dimensions: {
    width: number
    height: number
    quantity: number
  }
  options: {
    acabado: string
  }
  specialOptions: {
    expressShipping: boolean
    demoProduct: boolean
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function VidrioWizard({
  quoteId,
  initialData,
  expressDeliveryPercentage = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
  exhibitionPercentage = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE,
  onComplete,
  onCancel
}: VidrioWizardProps) {
  
  const getInitialValue = (key: string, defaultValue: unknown) => {
    if (initialData && typeof initialData === 'object' && key in initialData) {
      return initialData[key as keyof WizardInitialData]
    }
    return defaultValue
  }

  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedProduct: null,
    dimensions: {
      width: Number(getInitialValue('width', 0)),
      height: Number(getInitialValue('height', 0)),
      quantity: Number(getInitialValue('quantity', 1))
    },
    options: {
      acabado: String(getInitialValue('acabado', 'Transparente'))
    },
    specialOptions: {
      expressShipping: Boolean(getInitialValue('expressShipping', false)),
      demoProduct: Boolean(getInitialValue('demoProduct', false))
    }
  })

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/products?linea=Vidrio&limit=100', { next: { revalidate: 60 } })
        const data = await res.json()
        if (data.success) {
          setProducts(data.products || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (!loading && initialData && !restored) {
      setRestored(true)
      setState(prev => ({
        ...prev,
        dimensions: {
          width: initialData.width || prev.dimensions.width,
          height: initialData.height || prev.dimensions.height,
          quantity: initialData.quantity || prev.dimensions.quantity
        },
        specialOptions: {
          expressShipping: initialData.expressShipping || false,
          demoProduct: initialData.demoProduct || false
        }
      }))
    }
  }, [loading, initialData, restored])

  const calculateAreaM2 = () => {
    return calculateArea(state.dimensions.width, state.dimensions.height)
  }

  const calculateUnitPrice = () => {
    const area = calculateAreaM2()
    return (state.selectedProduct?.precioBaseM2 || 1500) * area
  }

  const calculateSubtotal = () => {
    return calculateUnitPrice() * state.dimensions.quantity
  }

  const calculateAdjustmentsData = () => {
    const subtotal = calculateSubtotal()
    return calculateAdjustments(
      subtotal,
      state.specialOptions.expressShipping,
      state.specialOptions.demoProduct,
      expressDeliveryPercentage,
      exhibitionPercentage
    )
  }

  const calculateTotal = () => {
    return calculateAdjustmentsData().total
  }

  const canGoNext = () => {
    switch (state.step) {
      case 1: return !!state.selectedProduct
      case 2: return state.dimensions.width > 0 && state.dimensions.height > 0
      case 3: return true
      default: return true
    }
  }

  const handleNext = () => {
    if (canGoNext() && state.step < 4) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as any }))
    }
  }

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as any }))
    }
  }

  const handleFinish = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const unitPrice = (state.selectedProduct?.precioBaseM2 || 1500) * area
    const { expressAmount, exhibitionAmount } = calculateAdjustmentsData()
    
    onComplete({
      quantity: state.dimensions.quantity,
      width: state.dimensions.width,
      height: state.dimensions.height,
      unitPrice,
      totalPrice: calculateTotal(),
      tonoVidrio: state.selectedProduct?.name,
      expressShipping: state.specialOptions.expressShipping,
      demoProduct: state.specialOptions.demoProduct,
      expressAmount,
      exhibitionAmount
    })
  }

  const renderStep = () => {
    switch (state.step) {
      case 1: return renderProductStep()
      case 2: return renderDimensionsStep()
      case 3: return renderOptionsStep()
      case 4: return renderSummaryStep()
      default: return null
    }
  }

  const renderProductStep = () => (
    <WizardStepContainer title="Selección de Vidrio" icon={Palette}>
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <WizardOptionCard
              key={product.id}
              selected={state.selectedProduct?.id === product.id}
              onClick={() => setState(prev => ({ ...prev, selectedProduct: product }))}
            >
              <div className="text-center">
                <h4 className="font-semibold text-sm">{product.name}</h4>
                <p className="text-sm text-green-600">${product.precioBaseM2}/m²</p>
              </div>
            </WizardOptionCard>
          ))}
        </div>
      )}
    </WizardStepContainer>
  )

  const renderDimensionsStep = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    return (
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
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">Área: <span className="font-medium">{area.toFixed(3)} m²</span></p>
        </div>
      </WizardStepContainer>
    )
  }

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

  const renderSummaryStep = () => {
    const area = calculateAreaM2()
    const unitPrice = calculateUnitPrice()
    const subtotal = calculateSubtotal()
    const { expressAmount, exhibitionAmount } = calculateAdjustmentsData()
    
    return (
      <WizardStepContainer title="Resumen" icon={FileText}>
        <div className="bg-gray-50 rounded-lg p-6 space-y-3 max-w-lg mx-auto">
          <WizardSummaryItem label="Producto" value={state.selectedProduct?.name || ''} />
          <WizardSummaryItem label="Dimensiones" value={`${state.dimensions.width} x ${state.dimensions.height} mm`} />
          <WizardSummaryItem label="Cantidad" value={state.dimensions.quantity} />
          <WizardSummaryItem label="Área" value={`${area.toFixed(3)} m²`} />
          <WizardSummaryItem label="Precio unitario" value={`$${unitPrice.toFixed(2)}`} />
          <div className="border-t border-gray-200 my-2" />
          <WizardSummaryItem label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
          {state.specialOptions.expressShipping && (
            <WizardSummaryItem 
              label={`Envío express (+${expressDeliveryPercentage}%)`} 
              value={`+$${expressAmount.toFixed(2)}`} 
              valueClass="text-blue-600"
            />
          )}
          {state.specialOptions.demoProduct && (
            <WizardSummaryItem 
              label={`Producto exhibición (-${exhibitionPercentage}%)`} 
              value={`-$${exhibitionAmount.toFixed(2)}`} 
              valueClass="text-green-600"
            />
          )}
          <div className="border-t border-gray-200 my-2" />
          <WizardSummaryItem label="Total" value={`$${calculateTotal().toFixed(2)}`} isTotal />
        </div>
      </WizardStepContainer>
    )
  }

  return (
    <div className="flex flex-col h-[480px]">
      <WizardProgressBar currentStep={state.step} totalSteps={4} />
      <div className="flex-1 overflow-y-auto">{renderStep()}</div>
      <WizardNavigation
        canGoBack={state.step > 1}
        canGoNext={canGoNext()}
        isLastStep={state.step === 4}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
        finishLabel="Agregar a Cotización"
        variant="green"
      />
    </div>
  )
}