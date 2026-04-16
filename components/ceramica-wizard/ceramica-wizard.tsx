'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Package, Ruler, ListChecks, FileText, Layers, Truck, Gift } from 'lucide-react'
import { formatMXN } from '@/lib/utils'
import Image from 'next/image'

// Componentes normalizados
import { 
  WizardProgressBar,
  WizardNavigation,
  WizardStepContainer,
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
// INTERFAZ DEL PRODUCTO (del API)
// ============================================

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

// ============================================
// INTERFAZ DEL COMPONENTE
// ============================================

interface CeramicaWizardProps {
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

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

interface WizardState {
  step: Step
  selectedProduct: Product | null
  dimensions: {
    width: number
    height: number
    quantity: number
  }
  options: {
    faces: 'blanca' | 'especialidad'
    cubrecanto: 'tono-aluminio' | 'similar-ceramica'
    jaladera: string
    jaladeraId: string
    jaladeraOrientation: 'vertical' | 'horizontal'
    jaladeraPrice: number
    vetaOrientation: 'vertical' | 'horizontal'
  }
  specialOptions: {
    expressShipping: boolean
    demoProduct: boolean
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function CeramicaWizard({
  quoteId,
  initialData,
  expressDeliveryPercentage = WIZARD_CONSTANTS.DEFAULT_EXPRESS_PERCENTAGE,
  exhibitionPercentage = WIZARD_CONSTANTS.DEFAULT_EXHIBITION_PERCENTAGE,
  onComplete,
  onCancel
}: CeramicaWizardProps) {
  
  // ------------------------------------------
  // HELPER PARA OBTENER VALORES INICIALES
  // ------------------------------------------
  
  const getInitialValue = (key: string, defaultValue: unknown) => {
    if (initialData && typeof initialData === 'object' && key in initialData) {
      return initialData[key as keyof WizardInitialData]
    }
    return defaultValue
  }

  // ------------------------------------------
  // ESTADO
  // ------------------------------------------
  
  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedProduct: null,
    dimensions: {
      width: Number(getInitialValue('width', 0)),
      height: Number(getInitialValue('height', 0)),
      quantity: Number(getInitialValue('quantity', 1))
    },
    options: {
      faces: String(getInitialValue('faces', 'blanca')) === 'especialidad' ? 'especialidad' : 'blanca',
      cubrecanto: String(getInitialValue('cubrecanto', 'tono-aluminio')) === 'similar-ceramica' ? 'similar-ceramica' : 'tono-aluminio',
      jaladera: 'none',
      jaladeraId: String(getInitialValue('handleModelId', '')),
      jaladeraOrientation: String(getInitialValue('jaladeraOrientation', 'vertical')) as 'vertical' | 'horizontal',
      jaladeraPrice: Number(getInitialValue('handlePrice', 0)),
      vetaOrientation: String(getInitialValue('vetaOrientation', 'vertical')) as 'vertical' | 'horizontal'
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

  // ------------------------------------------
  // CARGA DE DATOS
  // ------------------------------------------
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [productsRes, handleRes] = await Promise.all([
          fetch('/api/products?search=Cerámica&limit=100', { next: { revalidate: 60 } }),
          fetch('/api/handle-models', { next: { revalidate: 300 } })
        ])
        
        const productsData = await productsRes.json()
        const handleData = await handleRes.json()
        
        if (productsData.success) {
          setProducts(productsData.products || [])
        }
        if (handleData.success) {
          setHandleModels(handleData.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Restaurar producto seleccionado
  useEffect(() => {
    if (initialData?.productId && products.length > 0 && !restored) {
      const product = products.find(p => p.id === initialData.productId)
      if (product) {
        setState(prev => ({ ...prev, selectedProduct: product }))
      }
    }
  }, [initialData?.productId, products, restored])

  // Sincronizar jaladera desde nombre a ID
  useEffect(() => {
    if (handleModels.length > 0 && initialData?.jaladera && initialData.jaladera !== 'No aplica' && !restored) {
      const handleByName = handleModels.find(h => h.name === initialData.jaladera)
      if (handleByName) {
        const pricePerUnit = handleByName.price ? parseFloat(handleByName.price) * (
          state.options.jaladeraOrientation === 'vertical' 
            ? state.dimensions.height / 1000 
            : state.dimensions.width / 1000
        ) : 0
        
        setState(prev => ({
          ...prev,
          options: { 
            ...prev.options, 
            jaladera: `handle-${handleByName.id}`,
            jaladeraId: handleByName.id,
            jaladeraPrice: pricePerUnit
          }
        }))
      }
    }
  }, [handleModels, initialData?.jaladera])

  // Restaurar estado completo
  useEffect(() => {
    if (initialData && !restored) {
      setRestored(true)
      setState(prev => ({
        ...prev,
        dimensions: {
          width: initialData.width || prev.dimensions.width,
          height: initialData.height || prev.dimensions.height,
          quantity: initialData.quantity || 1
        },
        options: {
          ...prev.options,
          faces: initialData.faces === 2 ? 'especialidad' : 'blanca',
          vetaOrientation: (initialData.vetaOrientation as 'vertical' | 'horizontal') || 'vertical',
          jaladeraOrientation: (initialData.jaladeraOrientation as 'vertical' | 'horizontal') || 'vertical'
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
  
  const getPricePerM2 = () => {
    if (!state.selectedProduct) return 0
    return state.selectedProduct.precioBaseM2 || state.selectedProduct.basePrice || 0
  }

  const calculateSubtotal = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const basePrice = getPricePerM2() * area
    return (basePrice + state.options.jaladeraPrice) * state.dimensions.quantity
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

  const getUnitPrice = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    return getPricePerM2() * area + state.options.jaladeraPrice
  }

  // ------------------------------------------
  // NAVEGACIÓN
  // ------------------------------------------
  
  const canGoNext = () => {
    switch (state.step) {
      case 1: return !!state.selectedProduct
      case 2: return state.dimensions.width > 0 && state.dimensions.height > 0
      case 3: return true
      case 4: return true
      case 5: return true
      case 6: return true
      case 7: return true
      default: return true
    }
  }

  const handleNext = () => {
    if (canGoNext() && state.step < 8) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as Step }))
    }
  }

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as Step }))
    }
  }

  const handleFinish = () => {
    const selectedHandle = handleModels.find(h => `handle-${h.id}` === state.options.jaladera)
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const unitPrice = getPricePerM2() * area + state.options.jaladeraPrice
    
    onComplete({
      productId: state.selectedProduct?.id,
      lineId: state.selectedProduct?.linea,
      customWidth: state.dimensions.width,
      customHeight: state.dimensions.height,
      quantity: state.dimensions.quantity,
      isTwoSided: state.options.faces === 'especialidad',
      vetaOrientation: state.options.vetaOrientation,
      cubrecanto: state.options.cubrecanto,
      jaladera: selectedHandle?.name || 'No aplica',
      edgeBanding: state.options.cubrecanto === 'tono-aluminio' ? 'Tono Aluminio' : 'Similar al tono de la cerámica',
      ceramicColor: state.options.faces === 'especialidad' ? 'Especialidad' : 'Blanca',
      jaladeraOrientation: state.options.jaladeraOrientation,
      handleModelId: state.options.jaladeraId,
      unitPrice,
      handlePrice: state.options.jaladeraPrice,
      totalPrice: calculateTotal(),
      isExpressDelivery: state.specialOptions.expressShipping,
      isExhibition: state.specialOptions.demoProduct,
      expressAmount: state.specialOptions.expressShipping 
        ? calculateSubtotal() * expressDeliveryPercentage / 100 
        : 0,
      exhibitionAmount: state.specialOptions.demoProduct 
        ? calculateSubtotal() * exhibitionPercentage / 100 
        : 0
    })
  }

  // ------------------------------------------
  // RENDER DE PASOS
  // ------------------------------------------
  
  const renderStep = () => {
    switch (state.step) {
      case 1: return renderProductSelection()
      case 2: return renderDimensions()
      case 3: return renderVetaOrientation()
      case 4: return renderFaces()
      case 5: return renderCubrecanto()
      case 6: return renderJaladera()
      case 7: return renderSpecialOptions()
      case 8: return renderSummary()
      default: return null
    }
  }

  // --- Paso 1: Selección de Producto ---
  const renderProductSelection = () => (
    <WizardStepContainer title="Selección de producto" icon={Package}>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="p-3 border rounded-lg animate-pulse">
              <div className="w-full h-20 bg-gray-200 rounded-md mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay productos de Cerámica disponibles
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setState(prev => ({ ...prev, selectedProduct: product }))}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                state.selectedProduct?.id === product.id 
                  ? 'border-primary bg-primary/10 ring-2 ring-primary' 
                  : 'border-gray-200'
              }`}
            >
              <div className="w-full h-20 relative bg-gray-100 rounded-md overflow-hidden mb-2">
                {(product.thumbnail || (product.images && product.images.length > 0)) ? (
                  <Image
                    src={product.thumbnail || product.images[0]}
                    alt={product.name}
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400 absolute inset-0 m-auto" />
                )}
              </div>
              <p className="text-sm font-medium text-center truncate">{product.name}</p>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded inline-block mt-1">
                {product.tiempoEntrega} días de entrega
              </span>
              {(product.precioBaseM2 || product.basePrice) > 0 && (
                <p className="text-xs text-center text-green-600 mt-1">
                  {formatMXN(product.precioBaseM2 || product.basePrice)}/m²
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </WizardStepContainer>
  )

  // --- Paso 2: Dimensiones ---
  const renderDimensions = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    
    return (
      <WizardStepContainer title="Dimensiones y cantidades" icon={Ruler}>
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
        
        {state.dimensions.width > 0 && state.dimensions.height > 0 && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Área por unidad: <strong>{area.toFixed(4)} m²</strong>
            </p>
          </div>
        )}
      </WizardStepContainer>
    )
  }

  // --- Paso 3: Orientación de Veta ---
  const renderVetaOrientation = () => (
    <WizardStepContainer title="Orientación de veta" icon={Layers}>
      <RadioGroup
        value={state.options.vetaOrientation}
        onValueChange={(value) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, vetaOrientation: value as 'vertical' | 'horizontal' }
        }))}
        className="flex space-x-4"
      >
        {WIZARD_CONSTANTS.ORIENTATION_OPTIONS.map((opt) => (
          <div key={opt.value} className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer">
            <RadioGroupItem value={opt.value} id={`veta-${opt.value}`} />
            <Label htmlFor={`veta-${opt.value}`} className="cursor-pointer font-medium">
              {opt.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 4: Caras ---
  const renderFaces = () => (
    <WizardStepContainer title="Caras" icon={Layers}>
      <RadioGroup
        value={state.options.faces}
        onValueChange={(value) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, faces: value as 'blanca' | 'especialidad' }
        }))}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
          <RadioGroupItem value="blanca" id="faces-blanca" />
          <Label htmlFor="faces-blanca" className="cursor-pointer font-medium">
            Blanca
          </Label>
        </div>
        
        <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
          <RadioGroupItem value="especialidad" id="faces-especialidad" />
          <Label htmlFor="faces-especialidad" className="cursor-pointer font-medium">
            Especialidad
          </Label>
        </div>
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 5: Cubrecanto ---
  const renderCubrecanto = () => (
    <WizardStepContainer title="Cubrecanto" icon={ListChecks}>
      <RadioGroup
        value={state.options.cubrecanto}
        onValueChange={(value) => setState(prev => ({ 
          ...prev, 
          options: { ...prev.options, cubrecanto: value as 'tono-aluminio' | 'similar-ceramica' }
        }))}
        className="space-y-3"
      >
        <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
          <RadioGroupItem value="tono-aluminio" id="cubrecanto-aluminio" />
          <Label htmlFor="cubrecanto-aluminio" className="cursor-pointer font-medium">
            Tono Aluminio
          </Label>
        </div>
        
        <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
          <RadioGroupItem value="similar-ceramica" id="cubrecanto-ceramica" />
          <Label htmlFor="cubrecanto-ceramica" className="cursor-pointer font-medium">
            Similar al tono de la cerámica
          </Label>
        </div>
      </RadioGroup>
    </WizardStepContainer>
  )

  // --- Paso 6: Jaladera ---
  const renderJaladera = () => {
    const selectedHandle = handleModels.find(h => `handle-${h.id}` === state.options.jaladera)
    
    return (
      <WizardStepContainer title="Jaladera" icon={ListChecks}>
        {/* Orientación */}
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Orientación</Label>
          <RadioGroup
            value={state.options.jaladeraOrientation}
            onValueChange={(value) => {
              const newOrientation = value as 'vertical' | 'horizontal'
              let newPrice = 0
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
                <RadioGroupItem value={opt.value} id={`orientation-${opt.value}`} />
                <Label htmlFor={`orientation-${opt.value}`} className="cursor-pointer">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Modelos */}
        <RadioGroup
          value={state.options.jaladera}
          onValueChange={(value) => {
            const handle = handleModels.find(h => `handle-${h.id}` === value)
            if (value === 'none') {
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
                  jaladera: `handle-${handle.id}`,
                  jaladeraId: handle.id,
                  jaladeraPrice: price
                }
              }))
            }
          }}
          className="space-y-2"
        >
          <div className="flex items-center space-x-3 p-2 border rounded-lg cursor-pointer">
            <RadioGroupItem value="none" id="jaladera-none" />
            <Label htmlFor="jaladera-none" className="cursor-pointer flex-1">
              No aplica
            </Label>
          </div>
          {handleModels.map((handle) => (
            <div key={handle.id} className="flex items-center space-x-3 p-2 border rounded-lg cursor-pointer">
              <RadioGroupItem value={`handle-${handle.id}`} id={`jaladera-${handle.id}`} />
              <Label htmlFor={`jaladera-${handle.id}`} className="cursor-pointer flex-1">
                {handle.name}
              </Label>
              {handle.price && (
                <span className="text-sm text-green-600">{formatMXN(parseFloat(handle.price))}/ml</span>
              )}
            </div>
          ))}
        </RadioGroup>
      </WizardStepContainer>
    )
  }

  // --- Paso 7: Opciones Especiales ---
  const renderSpecialOptions = () => (
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

  // --- Paso 8: Resumen ---
  const renderSummary = () => {
    const area = calculateArea(state.dimensions.width, state.dimensions.height)
    const selectedHandle = handleModels.find(h => `handle-${h.id}` === state.options.jaladera)
    const jaladeraLength = state.options.jaladeraOrientation === 'vertical' 
      ? state.dimensions.height / 1000 
      : state.dimensions.width / 1000
    const jaladeraPricePerMl = selectedHandle?.price ? parseFloat(selectedHandle.price) : 0
    
    return (
      <WizardStepContainer title="Resumen" icon={FileText}>
        <div className="bg-gray-50 rounded-lg p-6 space-y-3 max-w-lg mx-auto">
          <WizardSummaryItem label="Producto" value={state.selectedProduct?.name || '-'} />
          <WizardSummaryItem label="Dimensiones" value={`${state.dimensions.width}mm × ${state.dimensions.height}mm`} />
          <WizardSummaryItem label="Cantidad" value={state.dimensions.quantity} />
          <WizardSummaryItem label="Área total" value={`${(area * state.dimensions.quantity).toFixed(4)} m²`} />
          <WizardSummaryItem label="Caras" value={state.options.faces === 'blanca' ? 'Blanca' : 'Especialidad'} />
          <WizardSummaryItem label="Orientación veta" value={state.options.vetaOrientation === 'vertical' ? 'Vertical' : 'Horizontal'} />
          <WizardSummaryItem 
            label="Cubrecanto" 
            value={state.options.cubrecanto === 'tono-aluminio' ? 'Tono Aluminio' : 'Similar al tono de la cerámica'} 
          />
          <WizardSummaryItem 
            label="Jaladera" 
            value={state.options.jaladera === 'none' ? 'No aplica' : (selectedHandle?.name || 'No aplica')} 
          />
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
            <WizardSummaryItem label="Precio unitario" value={formatMXN(getUnitPrice())} />
            <WizardSummaryItem label="Subtotal" value={formatMXN(calculateSubtotal())} />
            
            {state.specialOptions.expressShipping && (
              <WizardSummaryItem 
                label={`Envío express (+${expressDeliveryPercentage}%)`} 
                value={formatMXN(calculateSubtotal() * expressDeliveryPercentage / 100)} 
              />
            )}
            
            {state.specialOptions.demoProduct && (
              <WizardSummaryItem 
                label={`Descuento exhibición (-${exhibitionPercentage}%)`} 
                value={formatMXN(calculateSubtotal() * exhibitionPercentage / 100)} 
              />
            )}
            
            <WizardSummaryItem label="Total" value={formatMXN(calculateTotal())} isTotal />
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
        totalSteps={8}
      />
      
      {/* Contenido del paso */}
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
      
      {/* Navegación */}
      <WizardNavigation
        canGoBack={state.step > 1}
        canGoNext={canGoNext()}
        isLastStep={state.step === 8}
        onBack={state.step === 1 ? onCancel : handleBack}
        onNext={handleNext}
        onFinish={handleFinish}
        backLabel={state.step === 1 ? 'Cancelar' : 'Atrás'}
        finishLabel="Agregar a Cotización"
        variant="green"
      />
    </div>
  )
}
