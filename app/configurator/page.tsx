
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductCard } from '@/components/product-card'
import { useToast } from '@/hooks/use-toast'
import { formatMXN, generateQuoteNumber } from '@/lib/utils'
import DimensionCalculator from '@/components/dimension-calculator'
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Package, 
  Palette, 
  FileText,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  Calculator,
  X
} from 'lucide-react'
import { Product, QuoteItem, ConfiguratorStep } from '@/lib/types'

const steps: ConfiguratorStep[] = [
  {
    id: 'room',
    title: 'Definir Espacio',
    description: 'Configura las dimensiones de tu cocina',
    completed: false,
    current: true,
  },
  {
    id: 'products',
    title: 'Seleccionar Productos',
    description: 'Elige los muebles para tu cocina',
    completed: false,
    current: false,
  },
  {
    id: 'customize',
    title: 'Personalizar',
    description: 'Ajusta materiales y acabados',
    completed: false,
    current: false,
  },
  {
    id: 'quote',
    title: 'Generar Cotización',
    description: 'Revisa y genera tu cotización',
    completed: false,
    current: false,
  },
]

interface RoomConfig {
  width: number
  height: number
  depth: number
  projectName: string
  customerName: string
  customerEmail: string
  customerPhone: string
  projectAddress: string
}

export default function ConfiguratorPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(0)
  const [configSteps, setConfigSteps] = useState(steps)
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    width: 4,
    height: 2.5,
    depth: 3,
    projectName: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    projectAddress: '',
  })
  const [selectedProducts, setSelectedProducts] = useState<(Product & { quantity: number, unitPrice: number, customWidth?: number, customHeight?: number })[]>([])
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null)

  useEffect(() => {
    fetchProducts()
    if (session?.user) {
      setRoomConfig(prev => ({
        ...prev,
        customerName: session.user.name || '',
        customerEmail: session.user.email || '',
      }))
    }
  }, [session])

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=50')
      const data = await response.json()
      
      if (data.success) {
        setAvailableProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const updateStepStatus = (stepIndex: number, completed: boolean, current: boolean = false) => {
    setConfigSteps(prev => prev.map((step, index) => ({
      ...step,
      completed: index < stepIndex ? true : index === stepIndex ? completed : false,
      current: index === stepIndex ? current : false,
    })))
  }

  const nextStep = () => {
    if (currentStep < configSteps.length - 1) {
      updateStepStatus(currentStep, true)
      const newStep = currentStep + 1
      setCurrentStep(newStep)
      updateStepStatus(newStep, false, true)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      const newStep = currentStep - 1
      setCurrentStep(newStep)
      updateStepStatus(newStep, false, true)
    }
  }

  const handleRoomConfigChange = (field: string, value: string | number) => {
    setRoomConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleAddProduct = (product: Product) => {
    const existingItem = selectedProducts.find(p => p.id === product.id && !p.customWidth && !p.customHeight)
    const unitPrice = product.pricing?.[0]?.finalPrice || 0
    
    if (existingItem) {
      setSelectedProducts(prev => prev.map(p => 
        p.id === product.id && !p.customWidth && !p.customHeight
          ? { ...p, quantity: p.quantity + 1 }
          : p
      ))
    } else {
      setSelectedProducts(prev => [...prev, { 
        ...product, 
        quantity: 1, 
        unitPrice 
      }])
    }
    
    toast({
      title: 'Producto agregado',
      description: `${product.name} se agregó a tu cotización`,
    })
  }

  const handleConfigureProduct = (product: Product) => {
    if (!product.isCustomizable || !product.basePrice) {
      handleAddProduct(product)
      return
    }
    setConfiguringProduct(product)
  }

  const handleAddCustomDimensionsToQuote = (data: {
    productId: string;
    quantity: number;
    customWidth: number;
    customHeight: number;
    calculatedPrice: number;
    area: number;
    totalPrice: number;
  }) => {
    const product = availableProducts.find(p => p.id === data.productId)
    if (!product) return

    // Check if we already have this exact configuration
    const existingItem = selectedProducts.find(p => 
      p.id === data.productId && 
      p.customWidth === data.customWidth && 
      p.customHeight === data.customHeight
    )
    
    if (existingItem) {
      setSelectedProducts(prev => prev.map(p => 
        p.id === data.productId && 
        p.customWidth === data.customWidth && 
        p.customHeight === data.customHeight
          ? { ...p, quantity: p.quantity + data.quantity }
          : p
      ))
    } else {
      setSelectedProducts(prev => [...prev, { 
        ...product, 
        quantity: data.quantity, 
        unitPrice: data.calculatedPrice,
        customWidth: data.customWidth,
        customHeight: data.customHeight
      }])
    }
    
    setConfiguringProduct(null)
    
    toast({
      title: 'Producto agregado con dimensiones personalizadas',
      description: `${product.name} - ${data.quantity} unidad(es) (${data.customWidth}×${data.customHeight}mm) - Total: ${formatMXN(data.totalPrice)}`,
    })
  }

  const handleUpdateQuantity = (productId: string, quantity: number, customWidth?: number, customHeight?: number) => {
    if (quantity <= 0) {
      handleRemoveProduct(productId, customWidth, customHeight)
      return
    }
    
    setSelectedProducts(prev => prev.map(p => 
      p.id === productId && 
      p.customWidth === customWidth && 
      p.customHeight === customHeight
        ? { ...p, quantity }
        : p
    ))
  }

  const handleRemoveProduct = (productId: string, customWidth?: number, customHeight?: number) => {
    setSelectedProducts(prev => prev.filter(p => 
      !(p.id === productId && p.customWidth === customWidth && p.customHeight === customHeight)
    ))
  }

  const calculateTotal = () => {
    const subtotal = selectedProducts.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
    const tax = subtotal * 0.16 // 16% IVA
    return {
      subtotal,
      tax,
      total: subtotal + tax
    }
  }

  const handleGenerateQuote = async () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (selectedProducts.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos un producto',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    
    try {
      const quoteData = {
        customerName: roomConfig.customerName,
        customerEmail: roomConfig.customerEmail,
        customerPhone: roomConfig.customerPhone,
        customerAddress: roomConfig.projectAddress,
        projectName: roomConfig.projectName,
        projectAddress: roomConfig.projectAddress,
        roomDimensions: {
          width: roomConfig.width,
          height: roomConfig.height,
          depth: roomConfig.depth,
        },
        items: selectedProducts.map(product => ({
          productId: product.id,
          quantity: product.quantity,
          unitPrice: product.unitPrice,
        })),
        notes: `Proyecto configurado con dimensiones: ${roomConfig.width}m x ${roomConfig.height}m x ${roomConfig.depth}m`,
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Cotización creada exitosamente',
          description: `Número de cotización: ${data.data.quoteNumber}`,
        })
        router.push(`/quotes/${data.data.id}`)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al crear la cotización',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error inesperado al crear la cotización',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNext = () => {
    switch (currentStep) {
      case 0: // Room step
        return roomConfig.projectName && roomConfig.customerName && roomConfig.customerEmail
      case 1: // Products step
        return selectedProducts.length > 0
      case 2: // Customize step
        return true
      default:
        return false
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Room Configuration
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre del Proyecto *</label>
                    <Input
                      value={roomConfig.projectName}
                      onChange={(e) => handleRoomConfigChange('projectName', e.target.value)}
                      placeholder="Mi Cocina de Lujo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dirección del Proyecto</label>
                    <Input
                      value={roomConfig.projectAddress}
                      onChange={(e) => handleRoomConfigChange('projectAddress', e.target.value)}
                      placeholder="Dirección donde se instalará"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre Completo *</label>
                    <Input
                      value={roomConfig.customerName}
                      onChange={(e) => handleRoomConfigChange('customerName', e.target.value)}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email *</label>
                    <Input
                      type="email"
                      value={roomConfig.customerEmail}
                      onChange={(e) => handleRoomConfigChange('customerEmail', e.target.value)}
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input
                      value={roomConfig.customerPhone}
                      onChange={(e) => handleRoomConfigChange('customerPhone', e.target.value)}
                      placeholder="+52 55 1234 5678"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dimensiones de la Cocina</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ancho (metros)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={roomConfig.width}
                      onChange={(e) => handleRoomConfigChange('width', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Alto (metros)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="2"
                      max="4"
                      value={roomConfig.height}
                      onChange={(e) => handleRoomConfigChange('height', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Profundidad (metros)</label>
                    <Input
                      type="number"
                      step="0.1"
                      min="1"
                      max="6"
                      value={roomConfig.depth}
                      onChange={(e) => handleRoomConfigChange('depth', parseFloat(e.target.value))}
                    />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Área total:</strong> {(roomConfig.width * roomConfig.depth).toFixed(1)} m²
                  </p>
                  <p className="text-sm text-blue-600 mt-1">
                    Dimensiones: {roomConfig.width}m × {roomConfig.height}m × {roomConfig.depth}m
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 1: // Product Selection
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {selectedProducts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Productos Seleccionados ({selectedProducts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedProducts.map((product, index) => (
                      <div key={`${product.id}-${product.customWidth || 'standard'}-${product.customHeight || 'standard'}-${index}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                          <div>
                            <h4 className="font-medium">{product.name}</h4>
                            <p className="text-sm text-gray-500">{product.sku}</p>
                            {product.customWidth && product.customHeight ? (
                              <div className="text-sm">
                                <Badge variant="secondary" className="mr-2">
                                  Personalizado: {product.customWidth}×{product.customHeight}mm
                                </Badge>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Estándar
                              </Badge>
                            )}
                            <p className="text-sm font-medium text-blue-600">
                              {formatMXN(product.unitPrice)}
                              {product.customWidth && product.customHeight && (
                                <span className="text-xs text-gray-500 ml-1">
                                  (cálculo automático)
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(product.id, product.quantity - 1, product.customWidth, product.customHeight)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center">{product.quantity}</span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleUpdateQuantity(product.id, product.quantity + 1, product.customWidth, product.customHeight)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleRemoveProduct(product.id, product.customWidth, product.customHeight)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {!configuringProduct ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Catálogo de Productos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableProducts.map((product) => (
                      <div key={product.id} className="relative">
                        <ProductCard
                          product={product}
                          onAddToQuote={handleAddProduct}
                        />
                        {product.isCustomizable && product.basePrice && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2"
                            onClick={() => handleConfigureProduct(product)}
                          >
                            <Calculator className="w-4 h-4 mr-2" />
                            Configurar Dimensiones
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Configurando: {configuringProduct.name}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfiguringProduct(null)}
                    className="ml-auto"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Volver al Catálogo
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">{configuringProduct.name}</h4>
                    <p className="text-blue-800 text-sm">{configuringProduct.description}</p>
                    <div className="mt-2">
                      <Badge variant="secondary">
                        SKU: {configuringProduct.sku}
                      </Badge>
                    </div>
                  </div>
                  
                  <DimensionCalculator
                    basePrice={configuringProduct.basePrice || 0}
                    productName={configuringProduct.name}
                    productId={configuringProduct.id}
                    currency={configuringProduct.currency || 'MXN'}
                    onAddToQuote={handleAddCustomDimensionsToQuote}
                    className="bg-white"
                  />

                  <div className="flex gap-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleAddProduct(configuringProduct)
                        setConfiguringProduct(null)
                      }}
                      className="flex-1"
                    >
                      Agregar con Dimensiones Estándar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )

      case 2: // Customization
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Personalización de Productos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Personalización Avanzada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Las opciones de personalización estarán disponibles próximamente
                  </p>
                  <Badge variant="secondary">Próximamente</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )

      case 3: // Quote Generation
        const totals = calculateTotal()
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resumen de la Cotización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Información del Proyecto</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Proyecto:</strong> {roomConfig.projectName}</p>
                      <p><strong>Cliente:</strong> {roomConfig.customerName}</p>
                      <p><strong>Email:</strong> {roomConfig.customerEmail}</p>
                      {roomConfig.customerPhone && (
                        <p><strong>Teléfono:</strong> {roomConfig.customerPhone}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Dimensiones</h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Ancho:</strong> {roomConfig.width} m</p>
                      <p><strong>Alto:</strong> {roomConfig.height} m</p>
                      <p><strong>Profundidad:</strong> {roomConfig.depth} m</p>
                      <p><strong>Área:</strong> {(roomConfig.width * roomConfig.depth).toFixed(1)} m²</p>
                    </div>
                  </div>
                </div>

                {/* Products Summary */}
                <div>
                  <h4 className="font-semibold mb-4">Productos Seleccionados</h4>
                  <div className="space-y-3">
                    {selectedProducts.map((product, index) => (
                      <div key={`${product.id}-${product.customWidth || 'standard'}-${product.customHeight || 'standard'}-${index}`} className="flex justify-between items-start p-3 border rounded">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.customWidth && product.customHeight ? (
                            <div className="space-y-1">
                              <Badge variant="secondary" className="text-xs">
                                Dimensiones: {product.customWidth}×{product.customHeight}mm
                              </Badge>
                              <p className="text-sm text-gray-500">
                                Cantidad: {product.quantity} × {formatMXN(product.unitPrice)} (calculado)
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <Badge variant="outline" className="text-xs">
                                Dimensiones estándar
                              </Badge>
                              <p className="text-sm text-gray-500">
                                Cantidad: {product.quantity} × {formatMXN(product.unitPrice)}
                              </p>
                            </div>
                          )}
                        </div>
                        <p className="font-semibold">
                          {formatMXN(product.quantity * product.unitPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatMXN(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (16%):</span>
                      <span>{formatMXN(totals.tax)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatMXN(totals.total)}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateQuote}
                  className="w-full h-12 text-lg"
                  disabled={loading}
                >
                  {loading ? (
                    <>Generando Cotización...</>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Generar Cotización
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Configurador de Cocinas
          </h1>
          <p className="text-lg text-gray-600">
            Diseña tu cocina perfecta paso a paso
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-6">
            {configSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                    step.completed
                      ? 'bg-green-500 text-white'
                      : step.current
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed ? <Check className="w-5 h-5" /> : index + 1}
                </div>
                {index < configSteps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step.completed ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {configSteps[currentStep].title}
            </h2>
            <p className="text-gray-600">
              {configSteps[currentStep].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          
          {currentStep < configSteps.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceedToNext()}
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <div />
          )}
        </div>
      </div>
    </div>
  )
}
