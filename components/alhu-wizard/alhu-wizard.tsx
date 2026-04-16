'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Check, ChevronLeft, ChevronRight, Package, Ruler, ListChecks, FileText, Truck, Gift, Palette } from 'lucide-react'
import { formatMXN } from '@/lib/utils'
import Image from 'next/image'

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

interface AlhuWizardProps {
  quoteId: string
  initialData?: Record<string, unknown>
  expressDeliveryPercentage?: number
  exhibitionPercentage?: number
  onComplete: (data: any) => void
  onCancel: () => void
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7

interface WizardState {
  step: Step
  selectedProduct: Product | null
  dimensions: {
    width: number
    height: number
    quantity: number
  }
  options: {
    tonoVidrio: string
    tonoAluminio: string
    jaladera: string
    jaladeraOrientation: 'vertical' | 'horizontal'
  }
  specialOptions: {
    expressShipping: boolean
    demoProduct: boolean
  }
}

const GLASS_TONES = [
  'Natural',
  'Ahumado Claro',
  'Bronce texturizado con 1 capa de pintura',
  'Espejo bronce de 6mm',
  'Tela encapsulada en vidrio ultraclaro de 4+4',
  'Tela encapsulada en vidrio claro de 4+4',
  'Espejo claro Anticado de 6mm',
  'Filtrasol Texturizado de 6mm',
  'Vidrio claro texturizado de 6mm con pintura',
  'Vidrio Cristazul texturizado de 6mm',
]

const ALUMINUM_TONES = [
  'Natural',
  'Negro',
  'Champagne',
]

export default function AlhuWizard({ quoteId, initialData, expressDeliveryPercentage, exhibitionPercentage, onComplete, onCancel }: AlhuWizardProps) {
  const getInitialValue = (key: string, defaultValue: unknown) => {
    if (initialData && typeof initialData === 'object' && key in initialData) {
      return initialData[key]
    }
    return defaultValue
  }

  const getDimValue = (key: string, defaultVal: number) => {
    if (initialData && typeof initialData === 'object') {
      const dims = initialData.dimensions as Record<string, unknown> | undefined
      if (dims && typeof dims === 'object' && key in dims) return Number(dims[key])
    }
    return defaultVal
  }

  const [state, setState] = useState<WizardState>({
    step: 1,
    selectedProduct: getInitialValue('productId', '') ? { id: String(getInitialValue('productId', '')), name: String(getInitialValue('productName', '')), description: null, basePrice: 0, precioBaseM2: 0, images: [], thumbnail: null, categoria: null, linea: null, lineaName: null, tonoColor: null, tonoVidrio: null, tiempoEntrega: null } : null,
    dimensions: {
      width: Number(getInitialValue('width', getDimValue('width', 0))),
      height: Number(getInitialValue('height', getDimValue('height', 0))),
      quantity: Number(getInitialValue('quantity', getDimValue('quantity', 1)))
    },
    options: {
      tonoVidrio: String(getInitialValue('tonoVidrio', getInitialValue('color', 'Natural'))),
      tonoAluminio: String(getInitialValue('tonoAluminio', getInitialValue('edgeBanding', 'Natural'))),
      jaladera: getInitialValue('handleModelId', '') ? `handle-${getInitialValue('handleModelId', '')}` : String(getInitialValue('handle', 'none')),
      jaladeraOrientation: String(getInitialValue('handleOrientation', getInitialValue('jaladeraOrientation', 'vertical'))) as 'vertical' | 'horizontal'
    },
    specialOptions: {
      expressShipping: Boolean(getInitialValue('expressShipping', getInitialValue('isExpressDelivery', false))),
      demoProduct: Boolean(getInitialValue('demoProduct', getInitialValue('isExhibition', false)))
    }
  })

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [handleModels, setHandleModels] = useState<HandleModel[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [productsRes, handlesRes] = await Promise.all([
          fetch('/api/products?linea=Alh%C3%BA&limit=100', { next: { revalidate: 60 } }),
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

  const canProceed = () => {
    switch (state.step) {
      case 1:
        return !!state.selectedProduct
      case 2:
        return state.dimensions.width > 0 && state.dimensions.height > 0
      case 3:
        return !!state.options.tonoVidrio
      case 4:
        return !!state.options.tonoAluminio
      case 5:
        return true
      case 6:
        return true
      case 7:
        return true
      default:
        return false
    }
  }

  const handleNext = () => {
    if (state.step < 7) {
      setState(prev => ({ ...prev, step: (prev.step + 1) as Step }))
    } else {
      handleAddToQuote()
    }
  }

  const handleBack = () => {
    if (state.step > 1) {
      setState(prev => ({ ...prev, step: (prev.step - 1) as Step }))
    }
  }

  const getBaseUnitPrice = () => {
    const pricePerM2 = 4440
    const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)
    return pricePerM2 * area
  }

  const getHandlePrice = () => {
    const selectedHandle = handleModels.find(h => `handle-${h.id}` === state.options.jaladera)
    if (!selectedHandle?.price || state.options.jaladera === 'none') return 0
    
    const length = state.options.jaladeraOrientation === 'vertical' 
      ? state.dimensions.height / 1000 
      : state.dimensions.width / 1000
    return parseFloat(selectedHandle.price) * length
  }

  const calculateExpressAmount = () => {
    const basePrice = getBaseUnitPrice()
    const handlePrice = getHandlePrice()
    const subtotal = (basePrice + handlePrice) * state.dimensions.quantity
    // Calculate express on total (without exhibition discount)
    return subtotal * (expressDeliveryPercentage || 0) / 100
  }

  const calculateExhibitionAmount = () => {
    const basePrice = getBaseUnitPrice()
    const handlePrice = getHandlePrice()
    const subtotal = (basePrice + handlePrice) * state.dimensions.quantity
    return subtotal * (exhibitionPercentage || 0) / 100
  }

  const calculatePrice = () => {
    const basePrice = getBaseUnitPrice()
    const handlePrice = getHandlePrice()
    const subtotal = (basePrice + handlePrice) * state.dimensions.quantity

    const expressAmount = state.specialOptions.expressShipping ? subtotal * ((expressDeliveryPercentage || 0) / 100) : 0
    const exhibitionAmount = state.specialOptions.demoProduct ? subtotal * ((exhibitionPercentage || 0) / 100) : 0

    return subtotal + expressAmount - exhibitionAmount
  }

  const handleAddToQuote = () => {
    const selectedHandle = handleModels.find(h => `handle-${h.id}` === state.options.jaladera)
    
    const itemData = {
      productId: state.selectedProduct?.id,
      productName: state.selectedProduct?.name,
      width: state.dimensions.width,
      height: state.dimensions.height,
      quantity: state.dimensions.quantity,
      unitPrice: getBaseUnitPrice(),
      totalPrice: calculatePrice(),
      tonoVidrio: state.options.tonoVidrio,
      tonoAluminio: state.options.tonoAluminio,
      handleModelId: state.options.jaladera !== 'none' ? state.options.jaladera.replace('handle-', '') : null,
      handleModelName: selectedHandle?.name || null,
      handleOrientation: state.options.jaladeraOrientation,
      handlePrice: getHandlePrice(),
      expressShipping: state.specialOptions.expressShipping,
      demoProduct: state.specialOptions.demoProduct,
      expressAmount: calculateExpressAmount(),
      exhibitionAmount: calculateExhibitionAmount(),
    }
    
    onComplete(itemData)
  }

  const renderStep = () => {
    switch (state.step) {
      case 1:
        return renderProductSelection()
      case 2:
        return renderDimensions()
      case 3:
        return renderTonoVidrio()
      case 4:
        return renderTonoAluminio()
      case 5:
        return renderJaladera()
      case 6:
        return renderSpecialOptions()
      case 7:
        return renderSummary()
      default:
        return null
    }
  }

  const renderProductSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Selección de producto</h3>
      </div>
      
      {loading ? (
        <div className="text-center py-8">Cargando productos...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay productos de Alhú disponibles
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
                {(product.thumbnail || (product.images && Array.isArray(product.images) && product.images.length > 0)) ? (
                  <Image
                    src={product.thumbnail || product.images?.[0]}
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
    </div>
  )

  const renderDimensions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Ruler className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Dimensiones y cantidades</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="width">Ancho (mm)</Label>
          <Input
            id="width"
            type="number"
            min="300"
            max="1500"
            value={state.dimensions.width || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              dimensions: { ...prev.dimensions, width: parseInt(e.target.value) || 0 }
            }))}
            placeholder="Ej: 600"
          />
        </div>
        
        <div>
          <Label htmlFor="height">Alto (mm)</Label>
          <Input
            id="height"
            type="number"
            min="500"
            max="2400"
            value={state.dimensions.height || ''}
            onChange={(e) => setState(prev => ({
              ...prev,
              dimensions: { ...prev.dimensions, height: parseInt(e.target.value) || 0 }
            }))}
            placeholder="Ej: 800"
          />
        </div>
        
        <div>
          <Label htmlFor="quantity">Cantidad</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            max="1000"
            value={state.dimensions.quantity}
            onChange={(e) => setState(prev => ({
              ...prev,
              dimensions: { ...prev.dimensions, quantity: parseInt(e.target.value) || 1 }
            }))}
          />
        </div>
      </div>
      
      {state.dimensions.width > 0 && state.dimensions.height > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Área por unidad: <strong>{((state.dimensions.width / 1000) * (state.dimensions.height / 1000)).toFixed(4)} m²</strong>
          </p>
        </div>
      )}
    </div>
  )

  const renderTonoVidrio = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Tono Vidrio</h3>
      </div>
      
      <RadioGroup
        value={state.options.tonoVidrio}
        onValueChange={(value) => setState(prev => ({
          ...prev,
          options: { ...prev.options, tonoVidrio: value }
        }))}
        className="space-y-2"
      >
        {GLASS_TONES.map((tone) => (
          <div key={tone} className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value={tone} id={`vidrio-${tone}`} />
            <Label htmlFor={`vidrio-${tone}`} className="cursor-pointer font-medium flex-1">
              {tone}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )

  const renderTonoAluminio = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Palette className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Tono Aluminio</h3>
      </div>
      
      <RadioGroup
        value={state.options.tonoAluminio}
        onValueChange={(value) => setState(prev => ({
          ...prev,
          options: { ...prev.options, tonoAluminio: value }
        }))}
        className="space-y-2"
      >
        {ALUMINUM_TONES.map((tone) => (
          <div key={tone} className="flex items-center space-x-3 p-3 border rounded-lg">
            <RadioGroupItem value={tone} id={`aluminio-${tone}`} />
            <Label htmlFor={`aluminio-${tone}`} className="cursor-pointer font-medium flex-1">
              {tone}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )

  const renderJaladera = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Jaladera</h3>
      </div>
      
      <div className="mb-4">
        <Label className="text-sm font-medium mb-2 block">Orientación</Label>
        <RadioGroup
          value={state.options.jaladeraOrientation}
          onValueChange={(value) => setState(prev => ({
            ...prev,
            options: { ...prev.options, jaladeraOrientation: value as 'vertical' | 'horizontal' }
          }))}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2 p-2 border rounded-lg">
            <RadioGroupItem value="vertical" id="alh-orientation-vertical" />
            <Label htmlFor="alh-orientation-vertical" className="cursor-pointer">
              Vertical
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-2 border rounded-lg">
            <RadioGroupItem value="horizontal" id="alh-orientation-horizontal" />
            <Label htmlFor="alh-orientation-horizontal" className="cursor-pointer">
              Horizontal
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <RadioGroup
        value={state.options.jaladera}
        onValueChange={(value) => setState(prev => ({
          ...prev,
          options: { ...prev.options, jaladera: value }
        }))}
        className="space-y-2"
      >
        <div className="flex items-center space-x-3 p-2 border rounded-lg">
          <RadioGroupItem value="none" id="alh-jaladera-none" />
          <Label htmlFor="alh-jaladera-none" className="cursor-pointer flex-1">
            No aplica
          </Label>
        </div>
        {handleModels.map((handle) => (
          <div key={handle.id} className="flex items-center space-x-3 p-2 border rounded-lg">
            <RadioGroupItem value={`handle-${handle.id}`} id={`alh-jaladera-${handle.id}`} />
            <Label htmlFor={`alh-jaladera-${handle.id}`} className="cursor-pointer flex-1">
              {handle.name}
            </Label>
            {handle.price && (
              <span className="text-xs text-green-600">{formatMXN(parseFloat(handle.price))}/ml</span>
            )}
          </div>
        ))}
      </RadioGroup>
    </div>
  )

  const renderSpecialOptions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Opciones</h3>
      </div>
      
      <div className="space-y-3">
        <div 
          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
            state.specialOptions.expressShipping 
              ? 'border-primary bg-primary/10 ring-2 ring-primary' 
              : 'hover:shadow-md'
          }`}
          onClick={() => setState(prev => ({
            ...prev,
            specialOptions: { ...prev.specialOptions, expressShipping: !prev.specialOptions.expressShipping }
          }))}
        >
          <Checkbox
            checked={state.specialOptions.expressShipping}
            onCheckedChange={(checked) => setState(prev => ({
              ...prev,
              specialOptions: { ...prev.specialOptions, expressShipping: !!checked }
            }))}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              <Label htmlFor="alh-express-shipping" className="cursor-pointer font-medium">
                Envío express
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              Con cargo del {expressDeliveryPercentage ?? 0}%
            </p>
          </div>
        </div>
        
        <div 
          className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all ${
            state.specialOptions.demoProduct 
              ? 'border-primary bg-primary/10 ring-2 ring-primary' 
              : 'hover:shadow-md'
          }`}
          onClick={() => setState(prev => ({
            ...prev,
            specialOptions: { ...prev.specialOptions, demoProduct: !prev.specialOptions.demoProduct }
          }))}
        >
          <Checkbox
            checked={state.specialOptions.demoProduct}
            onCheckedChange={(checked) => setState(prev => ({
              ...prev,
              specialOptions: { ...prev.specialOptions, demoProduct: !!checked }
            }))}
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              <Label htmlFor="alh-demo-product" className="cursor-pointer font-medium">
                Producto para demostración
              </Label>
            </div>
            <p className="text-sm text-gray-500 ml-6">
              Con descuento del {exhibitionPercentage ?? 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSummary = () => {
    const selectedHandle = handleModels.find(h => `handle-${h.id}` === state.options.jaladera)
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Resumen</h3>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Producto:</span>
            <span className="font-medium">{state.selectedProduct?.name}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Dimensiones:</span>
            <span className="font-medium">{state.dimensions.width}mm × {state.dimensions.height}mm</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Cantidad:</span>
            <span className="font-medium">{state.dimensions.quantity} unidades</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Área total:</span>
            <span className="font-medium">
              {((state.dimensions.width / 1000) * (state.dimensions.height / 1000) * state.dimensions.quantity).toFixed(4)} m²
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Costo unitario:</span>
            <span className="font-medium">{formatMXN(getBaseUnitPrice())}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tono Vidrio:</span>
            <span className="font-medium">{state.options.tonoVidrio}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Tono Aluminio:</span>
            <span className="font-medium">{state.options.tonoAluminio}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Jaladera:</span>
            <span className="font-medium">{state.options.jaladera === 'none' ? 'No aplica' : (selectedHandle?.name || 'No aplica')}</span>
          </div>
          
          {state.options.jaladera !== 'none' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Orientación:</span>
              <span className="font-medium">{state.options.jaladeraOrientation === 'vertical' ? 'Vertical' : 'Horizontal'}</span>
            </div>
          )}
          
          {selectedHandle?.price && state.options.jaladera !== 'none' && (
            <div className="flex justify-between">
              <span className="text-gray-600">Costo Jaladera:</span>
              <span className="font-medium">{formatMXN(getHandlePrice())}</span>
            </div>
          )}
          
          {state.specialOptions.expressShipping && (
            <div className="flex justify-between text-orange-600">
              <span className="font-medium">Envío express (+{expressDeliveryPercentage}%):</span>
              <span className="font-medium">{formatMXN(calculateExpressAmount())}</span>
            </div>
          )}
          
          {state.specialOptions.demoProduct && (
            <div className="flex justify-between text-green-600">
              <span className="font-medium">Descuento exhibición (-{exhibitionPercentage}%):</span>
              <span className="font-medium">{formatMXN(calculateExhibitionAmount())}</span>
            </div>
          )}
          
          <div className="border-t pt-3 flex justify-between text-lg">
            <span className="font-bold">Total:</span>
            <span className="font-bold text-green-600">{formatMXN(calculatePrice())}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[480px]">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b shrink-0">
        {[1, 2, 3, 4, 5, 6, 7].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                state.step >= step 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {state.step > step ? <Check className="w-4 h-4" /> : step}
            </div>
            {step < 7 && (
              <div
                className={`w-12 h-1 mx-1 ${
                  state.step > step ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {renderStep()}
      </div>
      
      <div className="flex justify-between mt-2 pt-4 border-t shrink-0">
        <Button
          variant="outline"
          onClick={state.step === 1 ? onCancel : () => setState(prev => ({ ...prev, step: (prev.step - 1) as Step }))}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {state.step === 1 ? 'Cancelar' : 'Atrás'}
        </Button>
        
        {state.step < 7 ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Siguiente
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleAddToQuote}
            className="bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Agregar a Cotización
          </Button>
        )}
      </div>
    </div>
  )
}
