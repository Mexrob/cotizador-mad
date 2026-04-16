'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { Check, ChevronLeft, ChevronRight, Package, Ruler, ListChecks, FileText, Palette, Layers } from 'lucide-react'

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
// OPCIONES ESPECÍFICAS DEL WIZARD
// ============================================

const TONE_OPTIONS = [
  { name: 'Alaska', price: 1998, gradient: 'from-white to-gray-200' },
  { name: 'Obsidiana', price: 1998, gradient: 'from-gray-700 to-black' },
  { name: 'Magnesio', price: 1998, gradient: 'from-gray-300 to-gray-400' },
  { name: 'Topacio', price: 1998, gradient: 'from-amber-600 to-amber-800' }
]

const CUBRECANTO_OPTIONS = [
  { value: 'Mismo tono de puerta', label: 'Mismo tono de puerta' }
]

const HANDLE_OPTIONS = [
  { id: '', name: 'No aplica', price: '0' },
  { id: 'handle-sorento-a-negro', name: 'Sorento A Negro', price: '890' },
  { id: 'handle-sorento-l-negro', name: 'Sorento L Negro', price: '890' },
  { id: 'handle-sorento-g-negro', name: 'Sorento G Negro', price: '890' },
  { id: 'handle-sorento-a-aluminio', name: 'Sorento A Aluminio', price: '690' },
  { id: 'handle-sorento-l-aluminio', name: 'Sorento L Aluminio', price: '690' },
  { id: 'handle-sorento-g-aluminio', name: 'Sorento G Aluminio', price: '690' }
]

// ============================================
// INTERFAZ DEL COMPONENTE
// ============================================

interface SuperMateWizardProps {
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
  tonePrice: number
  selectedProductId: string
  dimensions: {
    width: number
    height: number
    quantity: number
  }
  options: {
    faces: '1' | '2'
    cubrecanto: string
    jaladera: string
    jaladeraId: string
    jaladeraOrientation: 'vertical' | 'horizontal'
    jaladeraPrice: number
  }
  specialOptions: {
    expressShipping: boolean
    demoProduct: boolean
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function SuperMateWizard({
  quoteId,
  initialData,
  expressDeliveryPercentage = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
  exhibitionPercentage = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE,
  onComplete,
  onCancel
}: SuperMateWizardProps) {
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/products?linea=Super%20Mate&limit=100', { next: { revalidate: 60 } })
        const data = await res.json()
        if (data.success) {
          setProducts(data.products || data.data || [])
        }
      } catch (error) {
        console.error('Error loading Super Mate products:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const getInitialValue = (key: string, defaultValue: unknown) => {
    if (initialData && typeof initialData === 'object' && key in initialData) {
      return initialData[key as keyof WizardInitialData]
    }
    return defaultValue
  }

  const [state, setState] = useState<WizardState>({
    step: 1,
    tone: '',
    tonePrice: 1998,
    selectedProductId: '',
    dimensions: {
      width: 0,
      height: 0,
      quantity: 1
    },
    options: {
      faces: '1',
      cubrecanto: 'Mismo tono de puerta',
      jaladera: 'No aplica',
      jaladeraId: '',
      jaladeraOrientation: 'vertical' as 'vertical' | 'horizontal',
      jaladeraPrice: 0
    },
    specialOptions: {
      expressShipping: false,
      demoProduct: false
    }
  })

  const [restored, setRestored] = useState(false)

  // ------------------------------------------
  // RESTAURACIÓN DE DATOS (al editar)
  // ------------------------------------------
  
  useEffect(() => {
    console.log('SuperMate initialData changed:', initialData)
    if (initialData && Object.keys(initialData).length > 0 && initialData.productId) {
      const toneOption = TONE_OPTIONS.find(t => t.name === initialData.tone)
      console.log('SuperMate restoring - tone from data:', initialData.tone, 'found:', toneOption?.name)
      console.log('SuperMate isTwoSided from data:', initialData.isTwoSided)
      setState({
        step: 1,
        tone: toneOption?.name || initialData.tone || TONE_OPTIONS[0]?.name || '',
        tonePrice: toneOption?.price || TONE_OPTIONS[0]?.price || 1998,
        dimensions: {
          width: initialData.width || 0,
          height: initialData.height || 0,
          quantity: initialData.quantity || 1
        },
        options: {
          faces: initialData.isTwoSided === true ? '2' : (initialData.isTwoSided === false ? '1' : '1'),
          cubrecanto: initialData.edgeBanding || 'Mismo tono de puerta',
          jaladera: initialData.handle || 'No aplica',
          jaladeraId: initialData.handleModelId || '',
          jaladeraOrientation: initialData.handleOrientation === 'vertical' || initialData.handleOrientation === 'horizontal' 
            ? initialData.handleOrientation as 'vertical' | 'horizontal'
            : 'vertical',
          jaladeraPrice: initialData.handlePrice || 0
        },
        specialOptions: {
          expressShipping: !!initialData.expressShipping,
          demoProduct: !!initialData.demoProduct
        }
      })
      setRestored(true)
    } else {
      console.log('SuperMate resetting to default state')
      setState({
        step: 1,
        tone: TONE_OPTIONS[0]?.name || '',
        tonePrice: TONE_OPTIONS[0]?.price || 1998,
        dimensions: {
          width: 0,
          height: 0,
          quantity: 1
        },
        options: {
          faces: '1',
          cubrecanto: 'Mismo tono de puerta',
          jaladera: 'No aplica',
          jaladeraId: '',
          jaladeraOrientation: 'vertical' as 'vertical' | 'horizontal',
          jaladeraPrice: 0
        },
        specialOptions: {
          expressShipping: false,
          demoProduct: false
        }
      })
      setRestored(false)
    }
  }, [initialData])

  // ------------------------------------------
  // FUNCIONES DE CÁLCULO
  // ------------------------------------------
  
  const calculateSubtotal = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const basePrice = state.tonePrice * area
    const handlePrice = state.options.jaladeraPrice
    return (basePrice + handlePrice) * state.dimensions.quantity
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
      case 2: return state.dimensions.width > 0 && state.dimensions.height > 0 && state.dimensions.quantity > 0
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
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const unitPrice = (state.tonePrice * area) + state.options.jaladeraPrice
    const subtotal = unitPrice * state.dimensions.quantity
    
    console.log('SuperMate handleFinish:', {
      tone: state.tone,
      tonePrice: state.tonePrice,
      faces: state.options.faces,
      isTwoSided: state.options.faces === '2',
      cubrecanto: state.options.cubrecanto
    })
    
    onComplete({
      tone: state.tone,
      toneId: '',
      productId: state.selectedProductId,
      width: state.dimensions.width,
      height: state.dimensions.height,
      quantity: state.dimensions.quantity,
      isTwoSided: state.options.faces === '2',
      edgeBanding: state.options.cubrecanto,
      handle: state.options.jaladera,
      handleModelId: state.options.jaladeraId,
      handlePrice: state.options.jaladeraPrice,
      handleOrientation: state.options.jaladeraOrientation,
      expressShipping: state.specialOptions.expressShipping,
      demoProduct: state.specialOptions.demoProduct,
      expressAmount: state.specialOptions.expressShipping 
        ? subtotal * expressDeliveryPercentage / 100 
        : 0,
      exhibitionAmount: state.specialOptions.demoProduct 
        ? subtotal * exhibitionPercentage / 100 
        : 0,
      unitPrice,
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
  const renderToneStep = () => {
    if (loading) {
      return (
        <WizardStepContainer title="Selección de Tono / Color" icon={Palette}>
          <div className="text-center py-8">Cargando productos...</div>
        </WizardStepContainer>
      )
    }
    
    if (products.length === 0) {
      return (
        <WizardStepContainer title="Selección de Tono / Color" icon={Palette}>
          <div className="text-center py-8 text-gray-500">No hay productos disponibles</div>
        </WizardStepContainer>
      )
    }
    
    return (
      <WizardStepContainer title="Selección de Tono / Color" icon={Palette}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <WizardOptionCard
              key={product.id}
              selected={state.selectedProductId === product.id}
              onClick={() => setState(prev => ({ 
                ...prev, 
                tone: product.tonoColor || product.name,
                tonePrice: product.precioBaseM2 || 1998,
                selectedProductId: product.id
              }))}
            >
              <div className="text-center">
                <h4 className="font-semibold text-sm">{product.name}</h4>
                <p className="text-sm text-green-600">${product.precioBaseM2 || 1998}/m²</p>
                {product.tiempoEntrega && (
                  <p className="text-xs text-gray-500 mt-1">Entrega: {product.tiempoEntrega} días</p>
                )}
              </div>
            </WizardOptionCard>
          ))}
        </div>
      </WizardStepContainer>
    )
  }

  // --- Paso 2: Dimensiones ---
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
              min={WIZARD_CONSTANTS.MIN_WIDTH}
              max={WIZARD_CONSTANTS.MAX_WIDTH}
              value={state.dimensions.width || ''}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                dimensions: { ...prev.dimensions, width: Number(e.target.value) }
              }))}
              placeholder={`${WIZARD_CONSTANTS.MIN_WIDTH}-${WIZARD_CONSTANTS.MAX_WIDTH}`}
            />
          </div>
          <div>
            <Label htmlFor="height">Alto (mm)</Label>
            <Input
              id="height"
              type="number"
              min={WIZARD_CONSTANTS.MIN_HEIGHT}
              max={WIZARD_CONSTANTS.MAX_HEIGHT}
              value={state.dimensions.height || ''}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                dimensions: { ...prev.dimensions, height: Number(e.target.value) }
              }))}
              placeholder={`${WIZARD_CONSTANTS.MIN_HEIGHT}-${WIZARD_CONSTANTS.MAX_HEIGHT}`}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Cantidad</Label>
            <Input
              id="quantity"
              type="number"
              min={WIZARD_CONSTANTS.DEFAULT_QUANTITY}
              value={state.dimensions.quantity || ''}
              onChange={(e) => setState(prev => ({ 
                ...prev, 
                dimensions: { ...prev.dimensions, quantity: Number(e.target.value) }
              }))}
            />
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Área: <span className="font-medium">{area.toFixed(3)} m²</span>
          </p>
        </div>
      </WizardStepContainer>
    )
  }

  // --- Paso 3: Caras ---
  const renderFacesStep = () => (
    <WizardStepContainer title="Caras" icon={Layers}>
      <RadioGroup
        value={state.options.faces}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, faces: v as '1' | '2' }
        }))}
        className="flex space-x-4"
      >
        {WIZARD_CONSTANTS.FACES_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
            <RadioGroupItem value={opt.value} id={`faces-${opt.value}`} />
            <Label htmlFor={`faces-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
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
        className="space-y-2"
      >
        {CUBRECANTO_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
            <RadioGroupItem value={opt.value} id={`cubrecanto-${opt.value}`} />
            <Label htmlFor={`cubrecanto-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 5: Jaladera ---
  const renderHandleStep = () => (
    <WizardStepContainer title="Selección de Jaladera" icon={Package}>
      {/* Orientación */}
      <div className="mb-4">
        <Label className="text-sm font-medium mb-2 block">Orientación</Label>
        <RadioGroup
          value={state.options.jaladeraOrientation}
          onValueChange={(v) => setState(prev => ({ 
            ...prev, 
            options: { ...prev.options, jaladeraOrientation: v as 'vertical' | 'horizontal' }
          }))}
          className="flex space-x-4"
        >
          {WIZARD_CONSTANTS.ORIENTATION_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2 p-2 border rounded-lg">
              <RadioGroupItem value={opt.value} id={`orientation-${opt.value}`} />
              <Label htmlFor={`orientation-${opt.value}`} className="cursor-pointer">{opt.label}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      {/* Modelos */}
      <RadioGroup
        value={state.options.jaladera}
        onValueChange={(v) => {
          const handle = HANDLE_OPTIONS.find(h => h.name === v)
          const price = handle ? parseFloat(handle.price) : 0
          const medida = state.options.jaladeraOrientation === 'vertical' 
            ? state.dimensions.height 
            : state.dimensions.width
          const calculatedPrice = price > 0 ? (medida / 1000) * price : 0
          
          setState(prev => ({ 
            ...prev, 
            options: { 
              ...prev.options, 
              jaladera: v,
              jaladeraId: handle?.id || '',
              jaladeraPrice: calculatedPrice
            }
          }))
        }}
        className="space-y-2"
      >
        {HANDLE_OPTIONS.map((handle) => (
          <div key={handle.name} className="flex items-center space-x-3 p-2 border rounded-lg cursor-pointer">
            <RadioGroupItem value={handle.name} id={`handle-${handle.name}`} />
            <Label htmlFor={`handle-${handle.name}`} className="cursor-pointer flex-1">
              {handle.name}
            </Label>
            {handle.price !== '0' && (
              <span className="text-sm text-green-600">${handle.price}/m</span>
            )}
          </div>
        ))}
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 6: Opciones ---
  const renderOptionsStep = () => (
    <WizardStepContainer title="Opciones" icon={ListChecks}>
      <div className="space-y-3 max-w-md">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="express"
            checked={state.specialOptions.expressShipping}
            onCheckedChange={(checked) => setState(prev => ({ 
              ...prev, 
              specialOptions: { ...prev.specialOptions, expressShipping: !!checked }
            }))}
          />
          <Label htmlFor="express" className="cursor-pointer">
            Envío express (+{expressDeliveryPercentage}%)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="exhibition"
            checked={state.specialOptions.demoProduct}
            onCheckedChange={(checked) => setState(prev => ({ 
              ...prev, 
              specialOptions: { ...prev.specialOptions, demoProduct: !!checked }
            }))}
          />
          <Label htmlFor="exhibition" className="cursor-pointer">
            Producto de exhibición (-{exhibitionPercentage}%)
          </Label>
        </div>
      </div>
    </WizardStepContainer>
  )

  // --- Paso 7: Resumen ---
  const renderSummaryStep = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const baseUnitPrice = state.tonePrice * area
    
    return (
      <WizardStepContainer title="Resumen de Configuración" icon={FileText}>
        <div className="bg-gray-50 rounded-lg p-6 space-y-3 max-w-lg mx-auto">
          <WizardSummaryItem label="Tono" value={state.tone} />
          <WizardSummaryItem label="Dimensiones" value={`${state.dimensions.width} x ${state.dimensions.height} mm`} />
          <WizardSummaryItem label="Cantidad" value={state.dimensions.quantity} />
          <WizardSummaryItem label="Área" value={`${area.toFixed(3)} m²`} />
          <WizardSummaryItem label="Caras" value={state.options.faces} />
          <WizardSummaryItem label="Tiempo de entrega" value="7 días" />
          <WizardSummaryItem label="Cubrecanto" value={state.options.cubrecanto} />
          <WizardSummaryItem 
            label="Jaladera" 
            value={state.options.jaladera === 'No aplica' 
              ? 'No aplica' 
              : `${state.options.jaladera} ($${state.options.jaladeraPrice.toFixed(2)})`} 
          />
          
          <div className="border-t pt-3">
            <WizardSummaryItem label="Precio unitario" value={`$${(baseUnitPrice + state.options.jaladeraPrice).toFixed(2)}`} />
            <WizardSummaryItem label="Subtotal" value={`$${calculateSubtotal().toFixed(2)}`} />
            
            {state.specialOptions.expressShipping && (
              <WizardSummaryItem 
                label={`Envío express (+${expressDeliveryPercentage}%)`} 
                value={`$${(calculateSubtotal() * expressDeliveryPercentage / 100).toFixed(2)}`} 
              />
            )}
            
            {state.specialOptions.demoProduct && (
              <WizardSummaryItem 
                label={`Descuento exhibición (-${exhibitionPercentage}%)`} 
                value={`-$${(calculateSubtotal() * exhibitionPercentage / 100).toFixed(2)}`} 
              />
            )}
            
            <WizardSummaryItem label="Total" value={`$${calculateTotal().toFixed(2)}`} isTotal />
          </div>
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