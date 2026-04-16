'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronLeft, Check, Package, Ruler, Palette, Layers } from 'lucide-react'
import { toast } from 'sonner'

interface ProductOption {
  id: string
  name: string
  sku: string
  collection: string | null
  colorToneText: string | null
  orientation: string | null
  faces: number | null
  basePrice: number
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
}

interface ProductOptions {
  lines: { id: string; name: string }[]
  collections: string[]
  tones: string[]
  orientations: string[]
  faces: number[]
  dimensions: {
    minWidth: number
    maxWidth: number
    minHeight: number
    maxHeight: number
  }
  products: ProductOption[]
}

interface SmartWizardProps {
  quoteId: string
  onComplete: () => void
  onCancel: () => void
}

const STEPS = [
  { id: 'line', title: 'Línea', icon: Package },
  { id: 'collection', title: 'Colección', icon: Layers },
  { id: 'tone', title: 'Tono/Color', icon: Palette },
  { id: 'orientation', title: 'Orientación', icon: Layers },
  { id: 'faces', title: 'Caras', icon: Layers },
  { id: 'edgeBanding', title: 'Cubrecanto', icon: Layers },
  { id: 'dimensions', title: 'Dimensiones', icon: Ruler },
  { id: 'quantity', title: 'Cantidad', icon: Package },
  { id: 'summary', title: 'Resumen', icon: Check },
]

export default function SmartWizard({ quoteId, onComplete, onCancel }: SmartWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [options, setOptions] = useState<ProductOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [selection, setSelection] = useState({
    lineId: '',
    collection: '',
    tone: '',
    orientation: '',
    faces: '' as string | '',
    edgeBanding: 'Mismo tono de puerta',
    width: 0,
    height: 0,
    quantity: 1,
  })

  const [filteredOptions, setFilteredOptions] = useState<ProductOptions | null>(null)

  useEffect(() => {
    fetchOptions()
  }, [])

  useEffect(() => {
    if (options && selection.lineId) {
      filterOptions()
    }
  }, [selection.lineId, selection.collection, selection.tone, selection.orientation, currentStep, options])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/products/options')
      const data = await response.json()
      setOptions(data)
      setFilteredOptions(data)
    } catch (error) {
      console.error('Error fetching options:', error)
      toast.error('Error al cargar opciones')
    } finally {
      setLoading(false)
    }
  }

  const filterOptions = async () => {
    if (!options) return

    try {
      const params = new URLSearchParams()
      if (selection.lineId) params.set('lineId', selection.lineId)
      
      // No filtrar por colección ni tono para mostrar todas las opciones disponibles
      // Solo filtrar por orientación cuando ya esté seleccionada
      if (selection.orientation) params.set('orientation', selection.orientation)

      const response = await fetch(`/api/products/options?${params}`)
      const data = await response.json()
      setFilteredOptions(data)
    } catch (error) {
      console.error('Error filtering options:', error)
    }
  }

  // Actualizar opciones cuando cambia el paso
  useEffect(() => {
    if (options && selection.lineId) {
      filterOptions()
    }
  }, [selection.lineId, selection.collection, selection.tone, selection.orientation, selection.faces, currentStep, options])

  const currentStepData = STEPS[currentStep]
  const StepIcon = currentStepData.icon

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return !!selection.lineId
      case 1:
        return filteredOptions?.collections.length === 0 || !!selection.collection
      case 2:
        return filteredOptions?.tones.length === 0 || !!selection.tone
      case 3:
        return filteredOptions?.orientations.length === 0 || !!selection.orientation
      case 4:
        return filteredOptions?.faces.length === 0 || !!selection.faces
      case 5:
        return !!selection.edgeBanding
      case 6:
        return selection.width > 0 && selection.height > 0
      case 7:
        return selection.quantity > 0
      default:
        return true
    }
  }

  const calculatePrice = () => {
    // Usar options como fuente principal de datos
    const productsToSearch = options
    if (!productsToSearch?.products?.length) return 0

    // Primero buscar por línea y colección
    let matchingProducts = productsToSearch.products.filter(p => {
      // Filtrar por línea usando el nombre de la línea
      const lineName = options?.lines?.find(l => l.id === selection.lineId)?.name
      if (lineName && !p.name.includes(lineName)) return false
      // Filtrar por colección
      if (selection.collection && p.collection !== selection.collection) return false
      return true
    })

    // Si hay productos, usar el primero que coincida con más criterios
    if (matchingProducts.length > 0) {
      // Preferir productos que coincidan con tono y orientación
      const bestMatch = matchingProducts.find(p => {
        return p.colorToneText === selection.tone && 
               p.orientation === selection.orientation &&
               p.faces === parseInt(selection.faces)
      }) || matchingProducts[0]
      
      const area = (Number(selection.width) / 1000) * (Number(selection.height) / 1000)
      const total = bestMatch.basePrice * area * selection.quantity
      
      console.log('Precio calculado:', { 
        product: bestMatch.name, 
        basePrice: bestMatch.basePrice, 
        area, 
        quantity: selection.quantity, 
        total 
      })
      
      return total
    }

    console.log('No se encontraron productos con:', selection)
    return 0
  }

  const getSelectedProduct = () => {
    // Buscar en options
    const productsToSearch = options
    if (!productsToSearch?.products?.length) return null

    // Buscar productos que coincidan con línea y colección
    let matchingProducts = productsToSearch.products.filter(p => {
      // Filtrar por línea usando el nombre
      const lineName = options?.lines?.find(l => l.id === selection.lineId)?.name
      if (lineName && !p.name.includes(lineName)) return false
      // Filtrar por colección
      if (selection.collection && p.collection !== selection.collection) return false
      return true
    })

    // Si hay productos, devolver el que mejor coincida
    if (matchingProducts.length > 0) {
      const bestMatch = matchingProducts.find(p => {
        return p.colorToneText === selection.tone && 
               p.orientation === selection.orientation &&
               p.faces === parseInt(selection.faces)
      }) || matchingProducts[0]
      return bestMatch
    }

    return null
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSave = async () => {
    const product = getSelectedProduct()
    if (!product) {
      console.error('Producto no encontrado. Selección actual:', selection)
      console.error('Productos disponibles:', filteredOptions?.products.length)
      toast.error('No se encontró un producto con las características seleccionadas')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/quotes/${quoteId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity: selection.quantity,
          customWidth: selection.width,
          customHeight: selection.height,
          edgeBanding: selection.edgeBanding,
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar')
      }

      toast.success('Producto agregado a la cotización')
      onComplete()
    } catch (error: any) {
      console.error('Error saving:', error)
      toast.error(error.message || 'Error al guardar el producto')
      // Cerrar el modal aunque haya error para evitar quedarse atascado
      onComplete()
    } finally {
      setSaving(false)
    }
  }

  const selectedProduct = getSelectedProduct()
  const dimensions = filteredOptions?.dimensions?.maxWidth ? filteredOptions.dimensions : (options?.dimensions || { minWidth: 100, maxWidth: 2000, minHeight: 100, maxHeight: 3000 })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[480px]">
      {/* Progress Steps */}
      <div className="flex items-center justify-between overflow-x-auto pb-2 border-b mb-2 shrink-0">
        {STEPS.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isCompleted = index < currentStep

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  isActive ? 'bg-primary text-primary-foreground' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}
                onClick={() => index < currentStep && setCurrentStep(index)}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                <span className="text-sm hidden sm:inline">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />}
            </div>
          )
        })}
      </div>

      {/* Step Content - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StepIcon className="h-5 w-5" />
            {currentStepData.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Step 0: Línea */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Label>Selecciona la línea de producto</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {options?.lines.map((line) => (
                  <div
                    key={line.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                      selection.lineId === line.id ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelection({ ...selection, lineId: line.id, collection: '', tone: '', orientation: '', faces: '' })}
                  >
                    <p className="font-medium text-center">{line.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Colección */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Label>Selecciona la colección (opcional)</Label>
              {filteredOptions?.collections.length === 0 ? (
                <p className="text-gray-500">Esta línea no tiene colecciones disponibles</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {filteredOptions?.collections.map((col) => (
                    <div
                      key={col}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        selection.collection === col ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelection({ ...selection, collection: col })}
                    >
                      <p className="font-medium text-center">{col}</p>
                    </div>
                  ))}
                </div>
              )}
              {selection.collection && (
                <Button variant="outline" size="sm" onClick={() => setSelection({ ...selection, collection: '' })}>
                  Quitar selección
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Tono */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <Label>Selecciona el tono/color</Label>
              {filteredOptions?.tones.length === 0 ? (
                <p className="text-gray-500">No hay tonos disponibles para esta selección</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
                  {filteredOptions?.tones.map((tone) => (
                    <div
                      key={tone}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        selection.tone === tone ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelection({ ...selection, tone })}
                    >
                      <p className="font-medium text-sm text-center">{tone}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Orientación */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <Label>Selecciona la orientación</Label>
              {filteredOptions?.orientations.length === 0 ? (
                <p className="text-gray-500">No hay orientaciones disponibles</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filteredOptions?.orientations
                    .filter(o => o !== 'Vertica' && o !== 'No aplica')
                    .map((orient) => (
                    <div
                      key={orient}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        selection.orientation === orient ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelection({ ...selection, orientation: orient })}
                    >
                      <p className="font-medium text-center">{orient}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Caras */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <Label>Selecciona el número de caras</Label>
              {filteredOptions?.faces.length === 0 ? (
                <p className="text-gray-500">No hay opciones de caras disponibles</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {filteredOptions?.faces.map((face) => (
                    <div
                      key={face}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                        selection.faces === String(face) ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelection({ ...selection, faces: String(face) })}
                    >
                      <p className="font-medium text-center">{face} cara{face > 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Cubrecanto */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <Label>Selecciona el cubrecanto</Label>
              <div className="grid grid-cols-1 gap-3">
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-primary ${
                    selection.edgeBanding === 'Mismo tono de puerta' ? 'border-primary bg-primary/5 ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelection({ ...selection, edgeBanding: 'Mismo tono de puerta' })}
                >
                  <p className="font-medium text-center">Mismo tono de puerta</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Dimensiones */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <Label>Ingresa las dimensiones (mm)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ancho (mm)</Label>
                  <Input
                    type="number"
                    value={selection.width || ''}
                    onChange={(e) => setSelection({ ...selection, width: parseInt(e.target.value) || 0 })}
                    placeholder={`${dimensions.minWidth} - ${dimensions.maxWidth}`}
                    min={dimensions.minWidth}
                    max={dimensions.maxWidth}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mín: {dimensions.minWidth}mm - Máx: {dimensions.maxWidth}mm
                  </p>
                </div>
                <div>
                  <Label>Alto (mm)</Label>
                  <Input
                    type="number"
                    value={selection.height || ''}
                    onChange={(e) => setSelection({ ...selection, height: parseInt(e.target.value) || 0 })}
                    placeholder={`${dimensions.minHeight} - ${dimensions.maxHeight}`}
                    min={dimensions.minHeight}
                    max={dimensions.maxHeight}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mín: {dimensions.minHeight}mm - Máx: {dimensions.maxHeight}mm
                  </p>
                </div>
              </div>
              {selection.width > 0 && selection.height > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">
                    Área: <strong>{((Number(selection.width) / 1000) * (Number(selection.height) / 1000)).toFixed(3)} m²</strong>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 7: Cantidad */}
          {currentStep === 7 && (
            <div className="space-y-4">
              <Label>Cantidad de piezas</Label>
              <Input
                type="number"
                value={selection.quantity}
                onChange={(e) => setSelection({ ...selection, quantity: parseInt(e.target.value) || 1 })}
                min={1}
                className="w-32"
              />
            </div>
          )}

          {/* Step 7: Resumen */}
          {currentStep === 8 && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Línea:</span>
                  <span className="font-medium">{options?.lines.find(l => l.id === selection.lineId)?.name}</span>
                </div>
                {selection.collection && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Colección:</span>
                    <span className="font-medium">{selection.collection}</span>
                  </div>
                )}
                {selection.tone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tono:</span>
                    <span className="font-medium">{selection.tone}</span>
                  </div>
                )}
                {selection.orientation && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orientación:</span>
                    <span className="font-medium">{selection.orientation}</span>
                  </div>
                )}
                {selection.faces && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Caras:</span>
                    <span className="font-medium">{selection.faces}</span>
                  </div>
                )}
                {selection.edgeBanding && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cubrecanto:</span>
                    <span className="font-medium">{selection.edgeBanding}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Dimensiones:</span>
                  <span className="font-medium">{selection.width} x {selection.height} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-medium">{selection.quantity} pieza{selection.quantity > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Producto:</span>
                  <span className="font-medium">{selectedProduct?.name || 'No encontrado'}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-semibold">Precio Total:</span>
                  <span className="font-bold text-green-600">${calculatePrice().toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Navigation Buttons - fixed at bottom */}
      <div className="flex justify-between mt-4 pt-4 border-t shrink-0">
        <Button variant="outline" onClick={currentStep === 0 ? onCancel : () => setCurrentStep(prev => prev - 1)} disabled={saving}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          {currentStep === 0 ? 'Cancelar' : 'Atrás'}
        </Button>
        {currentStep < STEPS.length - 1 ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Siguiente
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={!selectedProduct || saving}>
            {saving ? 'Guardando...' : 'Agregar a Cotización'}
          </Button>
        )}
      </div>
    </div>
  )
}
