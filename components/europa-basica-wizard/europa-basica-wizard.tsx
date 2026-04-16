'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { formatMXN } from '@/lib/utils'
import { Check, ChevronLeft, ChevronRight, Package, Ruler, ListChecks, FileText, Layers, Palette } from 'lucide-react'
import Image from 'next/image'

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

interface EuropaBasicaWizardProps {
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
  description: string | null
  basePrice: number
  precioBaseM2: number
  images: string[]
  thumbnail: string | null
  categoria: string | null
  linea: string | null
  lineaName: string | null
  tonoColor: string | null
  tonoVidrio: string | null
  tiempoEntrega: number | null
}

interface HandleModel {
  id: string
  name: string
  model: string
  finish: string
  price: string
  priceUnit: string
}

interface WizardState {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
  selectedProduct: Product | null
  tone: string
  dimensions: {
    width: number
    height: number
    quantity: number
  }
  options: {
    vetaOrientation: 'vertical' | 'horizontal'
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

export default function EuropaBasicaWizard({
  quoteId,
  initialData,
  expressDeliveryPercentage = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
  exhibitionPercentage = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE,
  onComplete,
  onCancel
}: EuropaBasicaWizardProps) {
  
  const getInitialValue = (key: string, defaultValue: unknown) => {
    if (initialData && typeof initialData === 'object' && key in initialData) {
      return initialData[key as keyof WizardInitialData]
    }
    return defaultValue
  }

  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedProduct: null,
    tone: String(getInitialValue('tone', '')),
    dimensions: {
      width: Number(getInitialValue('width', 0)),
      height: Number(getInitialValue('height', 0)),
      quantity: Number(getInitialValue('quantity', 1))
    },
    options: {
      vetaOrientation: String(getInitialValue('vetaOrientation', 'vertical')) as any,
      faces: '1',
      cubrecanto: String(getInitialValue('cubrecanto', 'Tono aluminio')),
      jaladera: String(getInitialValue('handle', 'No aplica')),
      jaladeraId: String(getInitialValue('handleModelId', '')),
      jaladeraOrientation: String(getInitialValue('handleOrientation', 'vertical')) as any,
      jaladeraPrice: Number(getInitialValue('handlePrice', 0))
    },
    specialOptions: {
      expressShipping: Boolean(getInitialValue('expressShipping', false)),
      demoProduct: Boolean(getInitialValue('demoProduct', false))
    }
  })

  const [products, setProducts] = useState<Product[]>([])
  const [handleModels, setHandleModels] = useState<HandleModel[]>([])
  const [loading, setLoading] = useState(true)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productsRes, handlesRes] = await Promise.all([
          fetch('/api/products?linea=EUR&limit=100', { next: { revalidate: 60 } }),
          fetch('/api/handle-models', { next: { revalidate: 300 } })
        ])
        
        const productsData = await productsRes.json()
        const handlesData = await handlesRes.json()
        
        if (productsData.success) {
          setProducts(productsData.products || productsData.data || [])
        }
        if (handlesData.success && handlesData.data) {
          setHandleModels(handlesData.data)
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
        tone: initialData.tone || prev.tone,
        dimensions: {
          width: initialData.width || prev.dimensions.width,
          height: initialData.height || prev.dimensions.height,
          quantity: initialData.quantity || prev.dimensions.quantity
        },
        options: {
          ...prev.options,
          vetaOrientation: (initialData.tone as any) || 'vertical',
          faces: initialData.isTwoSided ? '2' : '1',
          cubrecanto: initialData.edgeBanding || prev.options.cubrecanto,
          jaladera: initialData.handle || 'No aplica',
          jaladeraOrientation: initialData.handleOrientation as any || 'vertical'
        },
        specialOptions: {
          expressShipping: initialData.expressShipping || false,
          demoProduct: initialData.demoProduct || false
        }
      }))
    }
  }, [loading, initialData, restored])

  const calculateSubtotal = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const basePrice = state.selectedProduct?.precioBaseM2 || 1500
    const base = basePrice * area
    const handlePrice = state.options.jaladeraPrice
    return (base + handlePrice) * state.dimensions.quantity
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

  const canGoNext = () => {
    switch (state.step) {
      case 1: return !!state.selectedProduct || !!state.tone
      case 2: return state.dimensions.width > 0 && state.dimensions.height > 0
      case 3: return !!state.options.vetaOrientation
      case 4: return !!state.options.faces
      case 5: return !!state.options.cubrecanto
      case 6: return !!state.options.jaladera
      case 7: return true
      default: return true
    }
  }

  const handleNext = () => {
    if (canGoNext() && state.step < 8) {
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
    const unitPrice = (state.selectedProduct?.precioBaseM2 || 1500) * area + state.options.jaladeraPrice
    const subtotal = unitPrice * state.dimensions.quantity
    
    onComplete({
      quantity: state.dimensions.quantity,
      width: state.dimensions.width,
      height: state.dimensions.height,
      unitPrice,
      totalPrice: calculateTotal(),
      isTwoSided: state.options.faces === '2',
      edgeBanding: state.options.cubrecanto,
      tonoColor: state.tone,
      vetaOrientation: state.options.vetaOrientation,
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
        : 0
    })
  }

  const renderStep = () => {
    switch (state.step) {
      case 1: return renderToneStep()
      case 2: return renderDimensionsStep()
      case 3: return renderVetaStep()
      case 4: return renderFacesStep()
      case 5: return renderCubrecantoStep()
      case 6: return renderHandleStep()
      case 7: return renderOptionsStep()
      case 8: return renderSummaryStep()
      default: return null
    }
  }

  const renderToneStep = () => (
    <WizardStepContainer title="Selección de producto" icon={Palette}>
      {loading ? <div>Cargando...</div> : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <WizardOptionCard
              key={product.id}
              selected={state.selectedProduct?.id === product.id}
              onClick={() => setState(prev => ({ 
                ...prev, 
                selectedProduct: product,
                tone: product.tonoColor || product.name 
              }))}
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

  const renderVetaStep = () => (
    <WizardStepContainer title="Orientación de Veta" icon={Layers}>
      <RadioGroup
        value={state.options.vetaOrientation}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, vetaOrientation: v as any }
        }))}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="vertical" id="veta-vertical" />
            <Label htmlFor="veta-vertical">Vertical</Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="horizontal" id="veta-horizontal" />
            <Label htmlFor="veta-horizontal">Horizontal</Label>
          </div>
        </div>
      </RadioGroup>
    </WizardStepContainer>
  )

  const renderFacesStep = () => (
    <WizardStepContainer title="Caras" icon={Layers}>
      <RadioGroup
        value={state.options.faces}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, faces: v as any }
        }))}
      >
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="1" id="faces-1" />
            <Label htmlFor="faces-1">1 Cara</Label>
          </div>
          <div className="flex items-center space-x-2 p-3 border rounded-lg">
            <RadioGroupItem value="2" id="faces-2" />
            <Label htmlFor="faces-2">2 Caras</Label>
          </div>
        </div>
      </RadioGroup>
    </WizardStepContainer>
  )

  const renderCubrecantoStep = () => (
    <WizardStepContainer title="Cubrecanto" icon={ListChecks}>
      <RadioGroup
        value={state.options.cubrecanto}
        onValueChange={(v) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, cubrecanto: v }
        }))}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="Tono aluminio" id="cubrecanto-tono" />
            <Label htmlFor="cubrecanto-tono">Tono aluminio</Label>
          </div>
          <div className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value="Similar" id="cubrecanto-similar" />
            <Label htmlFor="cubrecanto-similar">Similar al tono de puerta</Label>
          </div>
        </div>
      </RadioGroup>
    </WizardStepContainer>
  )

  const renderHandleStep = () => {
    const selectedHandle = handleModels.find(h => h.name === state.options.jaladera)
    
    return (
      <WizardStepContainer title="Jaladera" icon={Package}>
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Orientación</Label>
          <RadioGroup
            value={state.options.jaladeraOrientation}
            onValueChange={(value) => {
              const newOrientation = value as 'vertical' | 'horizontal'
              let newPrice = state.options.jaladeraPrice
              if (selectedHandle?.price) {
                const medida = newOrientation === 'vertical' 
                  ? state.dimensions.height 
                  : state.dimensions.width
                newPrice = parseFloat(selectedHandle.price) * (medida / 1000)
              }
              setState(prev => ({ 
                ...prev, 
                options: { 
                  ...prev.options, 
                  jaladeraOrientation: newOrientation,
                  jaladeraPrice: newPrice
                }
              }))
            }}
            className="flex space-x-4"
          >
            {WIZARD_CONSTANTS.ORIENTATION_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2 p-2 border rounded-lg">
                <RadioGroupItem value={opt.value} id={`handle-orientation-${opt.value}`} />
                <Label htmlFor={`handle-orientation-${opt.value}`} className="cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <RadioGroup
          value={state.options.jaladera}
          onValueChange={(v) => {
            const handle = handleModels.find(h => h.name === v)
            if (v === 'none') {
              setState(prev => ({ 
                ...prev, 
                options: { 
                  ...prev.options, 
                  jaladera: 'none',
                  jaladeraId: '',
                  jaladeraPrice: 0
                }
              }))
            } else if (handle) {
              const medida = state.options.jaladeraOrientation === 'vertical' 
                ? state.dimensions.height 
                : state.dimensions.width
              const price = handle.price ? parseFloat(handle.price) * (medida / 1000) : 0
              setState(prev => ({ 
                ...prev, 
                options: { 
                  ...prev.options, 
                  jaladera: v,
                  jaladeraId: handle.id || '',
                  jaladeraPrice: price
                }
              }))
            }
          }}
        >
          <div className="space-y-2">
            <div className="flex items-center space-x-3 p-2 border rounded-lg cursor-pointer">
              <RadioGroupItem value="none" id="jaladera-none" />
              <Label htmlFor="jaladera-none" className="cursor-pointer flex-1">No aplica</Label>
            </div>
            {handleModels.map((handle) => (
              <div key={handle.name} className="flex items-center space-x-3 p-2 border rounded-lg cursor-pointer">
                <RadioGroupItem value={handle.name} id={`handle-${handle.name}`} />
                <Label htmlFor={`handle-${handle.name}`} className="flex-1">{handle.name}</Label>
                {handle.price && (
                  <span className="text-sm text-green-600">{formatMXN(parseFloat(handle.price))}/ml</span>
                )}
              </div>
            ))}
          </div>
        </RadioGroup>
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
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const baseUnitPrice = (state.selectedProduct?.precioBaseM2 || 1500) * area
    const jaladeraLength = state.options.jaladeraOrientation === 'vertical' 
      ? state.dimensions.height / 1000 
      : state.dimensions.width / 1000
    const jaladeraPricePerMl = state.options.jaladera !== 'none' && state.options.jaladeraPrice > 0 
      ? state.options.jaladeraPrice / jaladeraLength 
      : 0
    
    return (
      <WizardStepContainer title="Resumen" icon={FileText}>
        <div className="bg-gray-50 rounded-lg p-6 space-y-3 max-w-lg mx-auto">
          <WizardSummaryItem label="Producto" value={state.selectedProduct?.name || state.tone} />
          <WizardSummaryItem label="Dimensiones" value={`${state.dimensions.width} x ${state.dimensions.height} mm`} />
          <WizardSummaryItem label="Cantidad" value={state.dimensions.quantity} />
          <WizardSummaryItem label="Área" value={`${area.toFixed(3)} m²`} />
          <WizardSummaryItem label="Veta" value={state.options.vetaOrientation} />
          <WizardSummaryItem label="Caras" value={state.options.faces} />
          <WizardSummaryItem label="Cubrecanto" value={state.options.cubrecanto} />
          <WizardSummaryItem label="Jaladera" value={state.options.jaladera === 'none' ? 'No aplica' : state.options.jaladera} />
          {state.options.jaladera !== 'none' && (
            <>
              <WizardSummaryItem label="Orientación jaladera" value={state.options.jaladeraOrientation === 'vertical' ? 'Vertical' : 'Horizontal'} />
              <WizardSummaryItem 
                label="Costo jaladera" 
                value={`${formatMXN(jaladeraPricePerMl)}/ml × ${jaladeraLength.toFixed(3)} ml = ${formatMXN(state.options.jaladeraPrice)}`} 
              />
            </>
          )}
          <div className="border-t pt-3">
            <WizardSummaryItem label="Subtotal" value={`$${calculateSubtotal().toFixed(2)}`} />
            {state.specialOptions.expressShipping && (
              <WizardSummaryItem 
                label={`Envío express (+${expressDeliveryPercentage}%)`} 
                value={`+$${(calculateSubtotal() * expressDeliveryPercentage / 100).toFixed(2)}`} 
                valueClass="text-blue-600"
              />
            )}
            {state.specialOptions.demoProduct && (
              <WizardSummaryItem 
                label={`Descuento exhibición (-${exhibitionPercentage}%)`} 
                value={`-$${(calculateSubtotal() * exhibitionPercentage / 100).toFixed(2)}`} 
                valueClass="text-green-600"
              />
            )}
            <WizardSummaryItem label="Total" value={`$${calculateTotal().toFixed(2)}`} isTotal />
          </div>
        </div>
      </WizardStepContainer>
    )
  }

  return (
    <div className="flex flex-col h-[480px]">
      <WizardProgressBar currentStep={state.step} totalSteps={8} />
      <div className="flex-1 overflow-y-auto">{renderStep()}</div>
      <WizardNavigation
        canGoBack={state.step > 1}
        canGoNext={canGoNext()}
        isLastStep={state.step === 8}
        onBack={handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
        finishLabel="Agregar a Cotización"
        variant="green"
      />
    </div>
  )
}