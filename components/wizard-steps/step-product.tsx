'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Check, Loader2, Search, Package } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'
import { formatMXN } from '@/lib/utils'

interface Product {
  id: string
  name: string
  description: string | null
  basePrice: number
  images: string[]
  thumbnail: string | null
  category: {
    id: string
    name: string
  } | null
  line?: {
    id: string
    name: string
  } | null
}

export function StepProduct({ state, updateState, onNext, config }: WizardStepProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    (state.data.productIds as string[]) || []
  )
  
  const allowMultiple = false
  const selectedLine = state.data.line as string
  const selectedLineId = state.data.lineId as string

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('limit', '100')
        params.set('status', 'ACTIVE')
        if (search) {
          params.set('search', search)
        }
        if (state.data.lineId) {
          params.set('lineId', state.data.lineId as string)
        }
        
        const response = await fetch(`/api/products?${params}`)
        const result = await response.json()
        
        if (result.success) {
          const productsList = result.data.products || result.data || []
          setProducts(productsList)
        }
      } catch (error) {
        console.error('Error loading products:', error)
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(loadProducts, search ? 300 : 0)
    return () => clearTimeout(debounce)
  }, [search, state.data.lineId])

  // Sync selected products when products are loaded
  useEffect(() => {
    if (products.length > 0 && state.data.productIds && Array.isArray(state.data.productIds)) {
      const initialIds = state.data.productIds as string[]
      if (initialIds.length > 0 && selectedProducts.length === 0) {
        setSelectedProducts(initialIds)
      }
    }
  }, [products, state.data.productIds])

  const handleToggleProduct = (product: Product) => {
    const newSelection = [product.id]
    
    setSelectedProducts(newSelection)
    updateState({
      data: {
        ...state.data,
        productIds: newSelection,
        selectedProducts: newSelection.map(id => {
          const p = products.find(prod => prod.id === id)
          return p ? { id: p.id, name: p.name, price: p.basePrice } : null
        }).filter(Boolean)
      }
    })
  }

  const handleContinue = () => {
    if (selectedProducts.length > 0 || !config.isRequired) {
      setTimeout(onNext, 300)
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Selección de Productos</h2>
        <p className="text-muted-foreground">
          {selectedLine 
            ? `Selecciona un producto de la línea ${selectedLine}`
            : 'Selecciona un producto del catálogo'}
        </p>
      </div>

      <div className="relative max-w-md mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {selectedProducts.map(id => {
            const product = products.find(p => p.id === id)
            return product ? (
              <Badge key={id} variant="secondary" className="gap-1">
                {product.name}
                <button
                  onClick={() => handleToggleProduct(product)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ) : null
          })}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No se encontraron productos</p>
        </div>
      ) : (
        <div className="grid gap-4 max-w-5xl mx-auto sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => {
            const isSelected = selectedProducts.includes(product.id)
            return (
              <Card
                key={product.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  isSelected && 'border-primary ring-2 ring-primary'
                )}
                onClick={() => handleToggleProduct(product)}
              >
                {(product.images?.length > 0 || product.thumbnail) && (
                  <div className="h-32 relative overflow-hidden rounded-t-lg bg-gray-100 flex items-center justify-center">
                    <img
                      src={product.images?.[0] || product.thumbnail || ''}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium line-clamp-2">
                    {product.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-primary">
                      {formatMXN(product.basePrice)}
                    </span>
                    {isSelected && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  {product.category && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      {product.category.name}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button
          onClick={handleContinue}
          disabled={selectedProducts.length === 0 && config.isRequired}
          className={cn(
            "px-8 py-3 rounded-lg font-medium transition-colors",
            selectedProducts.length > 0 || !config.isRequired
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
