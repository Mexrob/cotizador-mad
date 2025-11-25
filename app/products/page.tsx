
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ProductCard } from '@/components/product-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import ProductForm from '@/components/product-form'
import { toast } from 'sonner'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  ChevronDown,
  Loader2,
  Plus
} from 'lucide-react'
import { Product, Category, ProductFilters } from '@/lib/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categoryId: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [filters])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.categoryId) params.set('categoryId', filters.categoryId)
      if (filters.sortBy) params.set('sortBy', filters.sortBy)
      if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (data.success) {
        setProducts(data.data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()

      if (data.success) {
        setCategories(data.data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleCategoryFilter = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      categoryId: categoryId === prev.categoryId ? '' : categoryId
    }))
  }

  const handleSort = (sortBy: 'name' | 'price' | 'newest' | 'popularity') => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleAddToQuote = (product: Product) => {
    // TODO: Implement add to quote functionality
    console.log('Add to quote:', product)
  }

  const handleQuickView = (product: Product) => {
    // TODO: Implement quick view modal
    console.log('Quick view:', product)
  }

  const handleAddProduct = () => {
    setShowProductForm(true)
  }

  const handleCloseProductForm = () => {
    setShowProductForm(false)
  }

  const handleSubmitProduct = async (data: any) => {
    try {
      setIsSubmitting(true)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Producto creado exitosamente')
        handleCloseProductForm()
        // Refresh the products list
        fetchProducts()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Error al guardar el producto')
      }
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Error al guardar el producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-module-black to-module-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.h1
            className="text-4xl md:text-6xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Catálogo de Productos
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Descubre nuestra amplia colección de muebles de cocina premium
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Buscar productos por nombre, descripción o SKU..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 py-3 text-lg"
              />
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  onClick={handleAddProduct}
                  className="flex items-center gap-2 bg-module-black hover:bg-module-dark text-white"
                >
                  <Plus className="w-4 h-4" />
                  Agregar Producto
                </Button>
              )}

              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filtros
              </Button>

              <Button
                variant={viewMode === 'grid' ? "default" : "outline"}
                onClick={() => setViewMode('grid')}
                size="icon"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>

              <Button
                variant={viewMode === 'list' ? "default" : "outline"}
                onClick={() => setViewMode('list')}
                size="icon"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Categories */}
                    <div>
                      <h3 className="font-semibold mb-3">Categorías</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={!filters.categoryId ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleCategoryFilter('')}
                        >
                          Todas las categorías
                        </Badge>
                        {categories.map((category) => (
                          <Badge
                            key={category.id}
                            variant={filters.categoryId === category.id ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => handleCategoryFilter(category.id)}
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Sort Options */}
                    <div>
                      <h3 className="font-semibold mb-3">Ordenar por</h3>
                      <div className="space-y-2">
                        {[
                          { key: 'name' as const, label: 'Nombre' },
                          { key: 'price' as const, label: 'Precio' },
                          { key: 'newest' as const, label: 'Más recientes' },
                        ].map((option) => (
                          <Button
                            key={option.key}
                            variant={filters.sortBy === option.key ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleSort(option.key)}
                            className="w-full justify-start"
                          >
                            {option.label}
                            {filters.sortBy === option.key && (
                              <span className="ml-2 text-xs">
                                {filters.sortOrder === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Additional Filters */}
                    <div>
                      <h3 className="font-semibold mb-3">Filtros adicionales</h3>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          Solo personalizables
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          En stock
                        </Button>
                        <Button variant="outline" size="sm" className="w-full justify-start">
                          Entrega rápida
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">
            {loading ? 'Cargando...' : `${products.length} productos encontrados`}
          </p>
          {filters.search && (
            <Button
              variant="ghost"
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="text-sm"
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-module-black" />
            <span className="ml-2 text-lg">Cargando productos...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-6">
              Intenta ajustar tus filtros o realizar una búsqueda diferente
            </p>
            <Button onClick={() => setFilters({ search: '', categoryId: '', sortBy: 'name', sortOrder: 'asc' })}>
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <motion.div
            className={`grid gap-6 ${viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
              }`}
            layout
          >
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                layout
              >
                <ProductCard
                  product={product}
                  onAddToQuote={handleAddToQuote}
                  onQuickView={handleQuickView}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Product Form Dialog */}
      <Dialog open={showProductForm} onOpenChange={setShowProductForm}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Producto</DialogTitle>
          </DialogHeader>
          <ProductForm
            onSubmit={handleSubmitProduct}
            onCancel={handleCloseProductForm}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
