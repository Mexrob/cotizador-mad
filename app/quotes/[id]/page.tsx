
'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatMXN, formatDate } from '@/lib/utils'
import { 
  ArrowLeft,
  Download,
  Edit,
  Copy,
  Check,
  Clock,
  X,
  AlertCircle,
  FileText,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Ruler,
  Package,
  Calendar,
  DollarSign,
  Loader2,
  Save,
  Plus,
  Minus,
  Trash2,
  Search
} from 'lucide-react'

interface Quote {
  id: string
  quoteNumber: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
  projectName: string
  projectAddress?: string
  roomDimensions?: {
    width: number
    height: number
    depth: number
  }
  subtotal: number
  taxAmount: number
  discountAmount?: number
  totalAmount: number
  validUntil: string
  deliveryDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    customWidth?: number
    customHeight?: number
    customDepth?: number
    product: {
      id: string
      name: string
      sku: string
      thumbnail?: string
      basePrice: number
      width: number
      height: number
      depth: number
      isCustomizable: boolean
      category?: {
        name: string
      }
      pricing?: Array<{
        userRole: string
        finalPrice: number
      }>
    }
  }>
  user: {
    name: string
    email: string
    companyName?: string
  }
}

interface Product {
  id: string
  name: string
  sku: string
  thumbnail?: string
  basePrice: number
  currency: string
  dimensionUnit: string
  width: number
  height: number
  depth: number
  isCustomizable: boolean
  category?: {
    name: string
  }
  pricing?: Array<{
    userRole: string
    finalPrice: number
  }>
}

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  
  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Edit form states
  const [editedQuote, setEditedQuote] = useState<Partial<Quote>>({})
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemQuantities, setItemQuantities] = useState<{ [key: string]: number }>({})
  
  // Add product modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [newProductQuantity, setNewProductQuantity] = useState(1)
  const [newProductWidth, setNewProductWidth] = useState('')
  const [newProductHeight, setNewProductHeight] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchQuote()
      fetchCompanySettings()
    }
  }, [params.id])

  useEffect(() => {
    if (quote) {
      setEditedQuote({
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        projectName: quote.projectName,
        projectAddress: quote.projectAddress,
        notes: quote.notes,
        discountAmount: quote.discountAmount,
      })
      
      // Initialize item quantities
      const quantities: { [key: string]: number } = {}
      quote.items.forEach(item => {
        quantities[item.id] = item.quantity
      })
      setItemQuantities(quantities)
    }
  }, [quote])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/quotes/${params.id}`)
      const data = await response.json()
      
      if (data.success) {
        setQuote(data.data)
      } else {
        setError(data.error || 'Error al cargar la cotización')
      }
    } catch (err) {
      setError('Error de conexión al cargar la cotización')
      console.error('Error fetching quote:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=100')
      const data = await response.json()
      
      if (data.success) {
        setAvailableProducts(data.data)
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    }
  }

  const fetchCompanySettings = async () => {
    try {
      const response = await fetch('/api/settings/company')
      const data = await response.json()
      
      if (data.success) {
        setCompanySettings(data.data)
      }
    } catch (err) {
      console.error('Error fetching company settings:', err)
    }
  }

  const startEditing = () => {
    setIsEditing(true)
    fetchProducts()
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setEditingItemId(null)
    if (quote) {
      setEditedQuote({
        customerName: quote.customerName,
        customerEmail: quote.customerEmail,
        customerPhone: quote.customerPhone,
        customerAddress: quote.customerAddress,
        projectName: quote.projectName,
        projectAddress: quote.projectAddress,
        notes: quote.notes,
        discountAmount: quote.discountAmount,
      })
      
      const quantities: { [key: string]: number } = {}
      quote.items.forEach(item => {
        quantities[item.id] = item.quantity
      })
      setItemQuantities(quantities)
    }
  }

  const saveChanges = async () => {
    if (!quote) return
    
    try {
      setSaving(true)
      
      // Update quote information
      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedQuote),
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update item quantities
        for (const itemId in itemQuantities) {
          const originalItem = quote.items.find(item => item.id === itemId)
          if (originalItem && itemQuantities[itemId] !== originalItem.quantity) {
            await updateItemQuantity(itemId, itemQuantities[itemId])
          }
        }
        
        await fetchQuote()
        setIsEditing(false)
        toast({
          title: 'Cambios guardados',
          description: 'La cotización ha sido actualizada exitosamente',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Error saving changes:', err)
      toast({
        title: 'Error',
        description: 'Error al guardar los cambios',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const updateItemQuantity = async (itemId: string, quantity: number) => {
    try {
      const response = await fetch(`/api/quotes/${params.id}/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      })
      
      if (!response.ok) {
        throw new Error('Error al actualizar cantidad')
      }
    } catch (err) {
      console.error('Error updating item quantity:', err)
      throw err
    }
  }

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/quotes/${params.id}/items/${itemId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchQuote()
        toast({
          title: 'Producto eliminado',
          description: 'El producto ha sido eliminado de la cotización',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      toast({
        title: 'Error',
        description: 'Error al eliminar el producto',
        variant: 'destructive',
      })
    }
  }

  // Get selected product price - now with useMemo for reactivity
  const selectedProductPrice = useMemo(() => {
    const selectedProduct = availableProducts.find(p => p.id === selectedProductId)
    if (!selectedProduct) {
      console.log('No selected product found for ID:', selectedProductId)
      return 0
    }
    
    console.log('Selected product:', selectedProduct)
    
    // First try to use pricing if available and populated
    if (selectedProduct.pricing && selectedProduct.pricing.length > 0) {
      console.log('Using pricing[0].finalPrice:', selectedProduct.pricing[0].finalPrice)
      return selectedProduct.pricing[0].finalPrice
    }
    
    // Fallback to basePrice
    console.log('Using basePrice fallback:', selectedProduct.basePrice)
    return selectedProduct.basePrice || 0
  }, [availableProducts, selectedProductId])

  // Calculate area in m² - reactive calculation
  const areaInSquareMeters = useMemo(() => {
    const width = parseFloat(newProductWidth) || 0
    const height = parseFloat(newProductHeight) || 0
    const area = (width / 1000) * (height / 1000)
    console.log('Area calculation:', {
      width: width,
      height: height,
      areaM2: area
    })
    return area
  }, [newProductWidth, newProductHeight])

  // Calculate price per unit - reactive calculation
  const pricePerUnit = useMemo(() => {
    if (selectedProductPrice === 0) {
      console.log('Price per unit = 0 because selectedProductPrice is 0')
      return 0
    }
    
    // Get the selected product to check if it's sold by area or by unit
    const selectedProduct = availableProducts.find(p => p.id === selectedProductId)
    
    let unitPrice = 0
    if (selectedProduct) {
      // Check if product has dimension-based pricing (for custom products)
      // If the product is customizable and has dimensions, calculate by area
      if (selectedProduct.isCustomizable) {
        // For customizable products, the price should be calculated based on the area
        // We need to determine if selectedProductPrice is per m² or per unit
        // Based on the seed data, prices are per unit, not per m²
        // So we need to convert the unit price to a per-area price
        
        // Standard product dimensions in m²
        const standardArea = (selectedProduct.width / 1000) * (selectedProduct.height / 1000)
        
        // Price per m² based on standard dimensions
        const pricePerSquareMeter = selectedProductPrice / standardArea
        
        // Calculate price for custom dimensions
        unitPrice = areaInSquareMeters * pricePerSquareMeter
        
        console.log('Customizable product calculation:', {
          selectedProductPrice,
          standardArea,
          pricePerSquareMeter,
          areaInSquareMeters,
          unitPrice
        })
      } else {
        // For non-customizable products, use the base price as-is
        unitPrice = selectedProductPrice
        console.log('Non-customizable product - using base price:', unitPrice)
      }
    } else {
      // Fallback: treat as area-based pricing
      unitPrice = areaInSquareMeters * selectedProductPrice
      console.log('Fallback area calculation:', {
        areaInSquareMeters,
        selectedProductPrice,
        unitPrice
      })
    }
    
    return unitPrice
  }, [areaInSquareMeters, selectedProductPrice, availableProducts, selectedProductId])

  // Calculate total price - reactive calculation
  const totalPrice = useMemo(() => {
    const total = newProductQuantity * pricePerUnit
    console.log('Total price calculation:', {
      quantity: newProductQuantity,
      pricePerUnit,
      total
    })
    return total
  }, [newProductQuantity, pricePerUnit])

  // Format price with 6 decimals for base price display
  const formatBasePriceMXN = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(amount)
  }

  // Calculate real-time summary from current items and quantities
  const calculatedSummary = useMemo(() => {
    if (!quote || !quote.items) {
      return {
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0
      }
    }

    // Calculate subtotal based on current items and quantities with recalculated unit prices
    const subtotal = quote.items.reduce((sum, item) => {
      const currentQuantity = itemQuantities[item.id] !== undefined 
        ? itemQuantities[item.id] 
        : item.quantity

      // Recalculate unit price based on product data and custom dimensions
      let unitPrice = 0
      const product = item.product
      
      if (product) {
        // Get base price (try pricing first, then basePrice)
        let basePrice = 0
        if (product.pricing && product.pricing.length > 0) {
          basePrice = product.pricing[0].finalPrice
        } else {
          basePrice = product.basePrice || 0
        }

        // Calculate unit price based on custom dimensions for customizable products
        if (product.isCustomizable && item.customWidth && item.customHeight && product.width && product.height) {
          // Standard product dimensions in m²
          const standardArea = (product.width / 1000) * (product.height / 1000)
          
          // Custom dimensions area in m²
          const customArea = (item.customWidth / 1000) * (item.customHeight / 1000)
          
          // Price per m² based on standard dimensions
          const pricePerSquareMeter = standardArea > 0 ? basePrice / standardArea : 0
          
          // Calculate price for custom dimensions
          unitPrice = customArea * pricePerSquareMeter
        } else {
          // For non-customizable products, use the base price as-is
          unitPrice = basePrice
        }
      } else {
        // Fallback to stored unitPrice if product data is not available
        unitPrice = item.unitPrice || 0
      }

      return sum + (unitPrice * currentQuantity)
    }, 0)

    // Calculate tax (16%)
    const taxAmount = subtotal * 0.16

    // Apply discount
    const discountAmount = (isEditing ? (editedQuote.discountAmount || 0) : (quote.discountAmount || 0))

    // Calculate total
    const totalAmount = subtotal + taxAmount - discountAmount

    return {
      subtotal,
      taxAmount,
      totalAmount,
      discountAmount
    }
  }, [quote, itemQuantities, isEditing, editedQuote.discountAmount])

  const addProduct = async () => {
    if (!selectedProductId) return
    
    try {
      const response = await fetch(`/api/quotes/${params.id}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProductId,
          quantity: newProductQuantity,
          customDimensions: {
            width: parseFloat(newProductWidth) || 0,
            height: parseFloat(newProductHeight) || 0
          }
        }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        await fetchQuote()
        setShowAddProductModal(false)
        setSelectedProductId('')
        setNewProductQuantity(1)
        setNewProductWidth('')
        setNewProductHeight('')
        setProductSearch('')
        toast({
          title: 'Producto agregado',
          description: 'El producto ha sido agregado a la cotización',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Error adding product:', err)
      toast({
        title: 'Error',
        description: 'Error al agregar el producto',
        variant: 'destructive',
      })
    }
  }

  const handleDownloadPDF = async () => {
    try {
      toast({
        title: 'Abriendo PDF...',
        description: 'El PDF se abrirá en una nueva pestaña',
      })
      
      // Open the PDF in a new window/tab
      const pdfUrl = `/api/quotes/${params.id}/pdf`
      window.open(pdfUrl, '_blank')
      
      toast({
        title: 'PDF abierto',
        description: 'La cotización se ha abierto en una nueva pestaña',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al abrir el PDF',
        variant: 'destructive',
      })
    }
  }

  const handleDuplicateQuote = () => {
    toast({
      title: 'Funcionalidad próximamente',
      description: 'La duplicación de cotizaciones estará disponible pronto',
    })
  }

  const getStatusConfig = (status: Quote['status']) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Borrador',
          icon: Edit,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
        }
      case 'PENDING':
        return {
          label: 'Pendiente',
          icon: Clock,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        }
      case 'APPROVED':
        return {
          label: 'Aprobada',
          icon: Check,
          color: 'bg-green-100 text-green-800 border-green-200',
        }
      case 'REJECTED':
        return {
          label: 'Rechazada',
          icon: X,
          color: 'bg-red-100 text-red-800 border-red-200',
        }
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando cotización...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Error al cargar cotización
            </h2>
            <p className="text-gray-600 mb-6">
              {error || 'La cotización no fue encontrada'}
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button onClick={fetchQuote}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const statusConfig = getStatusConfig(quote.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/quotes">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Cotizaciones
                </Button>
              </Link>
              
              {/* Company Logo */}
              {companySettings?.logo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="hidden sm:block"
                >
                  <div className="relative w-16 h-16 bg-white/10 rounded-lg overflow-hidden backdrop-blur-sm border border-white/20">
                    <Image
                      src={companySettings.logo}
                      alt={companySettings.companyName || "Logotipo de la empresa"}
                      fill
                      className="object-contain p-2"
                      sizes="64px"
                    />
                  </div>
                </motion.div>
              )}
              
              <div>
                <motion.h1 
                  className="text-2xl md:text-3xl font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {quote.projectName}
                </motion.h1>
                <motion.p 
                  className="text-blue-100 flex items-center gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <FileText className="w-4 h-4" />
                  Cotización #{quote.quoteNumber}
                  {companySettings?.companyName && (
                    <>
                      <span className="mx-2">•</span>
                      <Building className="w-4 h-4" />
                      {companySettings.companyName}
                    </>
                  )}
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 lg:mt-0 flex flex-col sm:flex-row gap-2"
            >
              <Badge 
                variant="secondary" 
                className={`${statusConfig.color} flex items-center gap-1 px-3 py-1`}
              >
                <StatusIcon className="w-4 h-4" />
                {statusConfig.label}
              </Badge>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={saveChanges}
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                    <Button
                      onClick={cancelEditing}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      disabled={saving}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={startEditing}
                      variant="secondary"
                      size="sm"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Cotización
                    </Button>
                    <Button
                      onClick={handleDownloadPDF}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                    <Button
                      onClick={handleDuplicateQuote}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicar
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Información del Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="projectName" className="text-sm text-gray-500 mb-1">
                        Nombre del Proyecto
                      </Label>
                      {isEditing ? (
                        <Input
                          id="projectName"
                          value={editedQuote.projectName || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, projectName: e.target.value })}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{quote.projectName}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="projectAddress" className="text-sm text-gray-500 mb-1">
                        Dirección del Proyecto
                      </Label>
                      {isEditing ? (
                        <Input
                          id="projectAddress"
                          value={editedQuote.projectAddress || ''}
                          onChange={(e) => setEditedQuote({ ...editedQuote, projectAddress: e.target.value })}
                          className="mt-1"
                          placeholder="Dirección opcional"
                        />
                      ) : quote.projectAddress ? (
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {quote.projectAddress}
                        </p>
                      ) : (
                        <p className="text-gray-400 italic">No especificada</p>
                      )}
                    </div>
                  </div>

                  {quote.roomDimensions && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Dimensiones de la Cocina</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Ancho</p>
                          <p className="font-semibold">{quote.roomDimensions.width}m</p>
                        </div>
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Alto</p>
                          <p className="font-semibold">{quote.roomDimensions.height}m</p>
                        </div>
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Profundidad</p>
                          <p className="font-semibold">{quote.roomDimensions.depth}m</p>
                        </div>
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Área Total</p>
                          <p className="font-semibold">
                            {(quote.roomDimensions.width * quote.roomDimensions.depth).toFixed(1)}m²
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="notes" className="text-sm text-gray-500 mb-1">
                      Notas
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="notes"
                        value={editedQuote.notes || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, notes: e.target.value })}
                        className="mt-1"
                        placeholder="Notas adicionales del proyecto..."
                        rows={3}
                      />
                    ) : quote.notes ? (
                      <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{quote.notes}</p>
                    ) : (
                      <p className="text-gray-400 italic">Sin notas</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Productos ({quote.items.length})
                    </div>
                    {isEditing && (
                      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Producto
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Agregar Producto a la Cotización</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="productSearch">Buscar Producto</Label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                  id="productSearch"
                                  placeholder="Buscar por nombre o SKU..."
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  className="pl-10"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label>Seleccionar Producto</Label>
                              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un producto" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableProducts
                                    .filter(product => 
                                      productSearch === '' || 
                                      product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                      product.sku.toLowerCase().includes(productSearch.toLowerCase())
                                    )
                                    .map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{product.name}</span>
                                          <span className="text-sm text-gray-500">({product.sku})</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Quantity and Dimensions */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input
                                  id="quantity"
                                  type="number"
                                  min="1"
                                  max="1000"
                                  value={newProductQuantity}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 1
                                    if (value >= 1 && value <= 1000) {
                                      setNewProductQuantity(value)
                                    }
                                  }}
                                  className={newProductQuantity < 1 || newProductQuantity > 1000 ? 'border-red-500' : ''}
                                />
                                {(newProductQuantity < 1 || newProductQuantity > 1000) && (
                                  <p className="text-red-500 text-xs mt-1">Entre 1 y 1,000 unidades</p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor="width">Ancho (mm)</Label>
                                <Input
                                  id="width"
                                  type="number"
                                  min="10"
                                  max="50000"
                                  value={newProductWidth}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setNewProductWidth(value)
                                  }}
                                  placeholder="Ingrese el ancho en mm"
                                  autoComplete="off"
                                  className={newProductWidth && (parseFloat(newProductWidth) < 10 || parseFloat(newProductWidth) > 50000) ? 'border-red-500' : ''}
                                />
                                {newProductWidth && (parseFloat(newProductWidth) < 10 || parseFloat(newProductWidth) > 50000) && (
                                  <p className="text-red-500 text-xs mt-1">Entre 10mm y 50,000mm</p>
                                )}
                              </div>
                              
                              <div>
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input
                                  id="height"
                                  type="number"
                                  min="10"
                                  max="50000"
                                  value={newProductHeight}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setNewProductHeight(value)
                                  }}
                                  placeholder="Ingrese la altura en mm"
                                  autoComplete="off"
                                  className={newProductHeight && (parseFloat(newProductHeight) < 10 || parseFloat(newProductHeight) > 50000) ? 'border-red-500' : ''}
                                />
                                {newProductHeight && (parseFloat(newProductHeight) < 10 || parseFloat(newProductHeight) > 50000) && (
                                  <p className="text-red-500 text-xs mt-1">Entre 10mm y 50,000mm</p>
                                )}
                              </div>
                            </div>

                            {/* Price Calculation Preview */}
                            {selectedProductId && (
                              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">Vista Previa del Cálculo</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-gray-600">Cantidad: <span className="font-medium">{newProductQuantity} unidades</span></p>
                                    <p className="text-gray-600">Dimensiones: <span className="font-medium">{newProductWidth || '0'}mm × {newProductHeight || '0'}mm</span></p>
                                    <p className="text-gray-600">Área por unidad: <span className="font-medium">{areaInSquareMeters.toFixed(4)} m²</span></p>
                                  </div>
                                  <div>
                                    {(() => {
                                      const selectedProduct = availableProducts.find(p => p.id === selectedProductId);
                                      if (selectedProduct && selectedProduct.isCustomizable) {
                                        const standardArea = (selectedProduct.width / 1000) * (selectedProduct.height / 1000);
                                        const pricePerSquareMeter = selectedProductPrice / standardArea;
                                        return (
                                          <>
                                            <p className="text-gray-600">Precio base por unidad estándar: <span className="font-medium">{formatBasePriceMXN(selectedProductPrice)}</span></p>
                                            <p className="text-gray-600">Dimensión estándar: <span className="font-medium">{selectedProduct.width}mm × {selectedProduct.height}mm ({standardArea.toFixed(4)} m²)</span></p>
                                            <p className="text-gray-600">Precio por m²: <span className="font-medium">{formatMXN(pricePerSquareMeter)}</span></p>
                                          </>
                                        );
                                      } else {
                                        return <p className="text-gray-600">Precio base: <span className="font-medium">{formatBasePriceMXN(selectedProductPrice)} / unidad</span></p>;
                                      }
                                    })()}
                                    <p className="text-gray-600">Precio por unidad: <span className="font-medium">{formatMXN(pricePerUnit)}</span></p>
                                    <p className="text-blue-900 font-semibold text-lg">Precio Total: {formatMXN(totalPrice)}</p>
                                  </div>
                                </div>
                                {selectedProductPrice === 0 && (
                                  <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-xs">
                                    <strong>Nota:</strong> No se encontró precio para este producto. Verifique la configuración de precios.
                                  </div>
                                )}
                              </div>
                            )}
                            
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" onClick={() => setShowAddProductModal(false)}>
                                Cancelar
                              </Button>
                              <Button 
                                onClick={addProduct} 
                                disabled={!selectedProductId || newProductQuantity < 1 || newProductQuantity > 1000 || !newProductWidth || !newProductHeight || parseFloat(newProductWidth) < 10 || parseFloat(newProductWidth) > 50000 || parseFloat(newProductHeight) < 10 || parseFloat(newProductHeight) > 50000}
                              >
                                Agregar Producto
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {quote.items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {item.product.thumbnail ? (
                            <Image
                              src={item.product.thumbnail}
                              alt={item.product.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                          <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                          {item.product.category && (
                            <p className="text-xs text-blue-600">{item.product.category.name}</p>
                          )}
                          
                          {/* Custom Dimensions Display */}
                          <div className="mt-2 space-y-1">
                            {(item.customWidth && item.customHeight) ? (
                              <>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <Ruler className="w-3 h-3" />
                                  <span className="font-medium">Dimensiones:</span>
                                  <span className="bg-blue-50 px-2 py-0.5 rounded">
                                    {item.customWidth}mm × {item.customHeight}mm
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="w-3 h-3"></span>
                                  <span className="font-medium">Área:</span>
                                  <span className="bg-green-50 px-2 py-0.5 rounded">
                                    {((item.customWidth / 1000) * (item.customHeight / 1000)).toFixed(4)} m²
                                  </span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Ruler className="w-3 h-3" />
                                <span className="font-medium">Dimensiones estándar:</span>
                                <span className="bg-gray-50 px-2 py-0.5 rounded">
                                  {item.product.width}mm × {item.product.height}mm
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newQuantity = Math.max(1, (itemQuantities[item.id] || item.quantity) - 1)
                                  setItemQuantities({ ...itemQuantities, [item.id]: newQuantity })
                                }}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              
                              <Input
                                type="number"
                                min="1"
                                value={itemQuantities[item.id] || item.quantity}
                                onChange={(e) => {
                                  const newQuantity = Math.max(1, parseInt(e.target.value) || 1)
                                  setItemQuantities({ ...itemQuantities, [item.id]: newQuantity })
                                }}
                                className="w-20 text-center"
                              />
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newQuantity = (itemQuantities[item.id] || item.quantity) + 1
                                  setItemQuantities({ ...itemQuantities, [item.id]: newQuantity })
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteItem(item.id)}
                                className="ml-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">
                                {item.quantity} × {formatMXN(item.unitPrice)}
                              </p>
                              <p className="font-semibold text-lg">
                                {formatMXN(item.totalPrice)}
                              </p>
                              {/* Show price per area for customizable products */}
                              {item.customWidth && item.customHeight && item.product.isCustomizable && (
                                <p className="text-xs text-gray-400 mt-1">
                                  ({formatMXN(item.unitPrice / ((item.customWidth / 1000) * (item.customHeight / 1000)))}/m²)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="customerName" className="text-sm text-gray-500">
                      Nombre
                    </Label>
                    {isEditing ? (
                      <Input
                        id="customerName"
                        value={editedQuote.customerName || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, customerName: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium">{quote.customerName}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="customerEmail" className="text-sm text-gray-500">
                      Email
                    </Label>
                    {isEditing ? (
                      <Input
                        id="customerEmail"
                        type="email"
                        value={editedQuote.customerEmail || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, customerEmail: e.target.value })}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {quote.customerEmail}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="customerPhone" className="text-sm text-gray-500">
                      Teléfono
                    </Label>
                    {isEditing ? (
                      <Input
                        id="customerPhone"
                        value={editedQuote.customerPhone || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, customerPhone: e.target.value })}
                        className="mt-1"
                        placeholder="Teléfono opcional"
                      />
                    ) : quote.customerPhone ? (
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {quote.customerPhone}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">No especificado</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="customerAddress" className="text-sm text-gray-500">
                      Dirección
                    </Label>
                    {isEditing ? (
                      <Textarea
                        id="customerAddress"
                        value={editedQuote.customerAddress || ''}
                        onChange={(e) => setEditedQuote({ ...editedQuote, customerAddress: e.target.value })}
                        className="mt-1"
                        placeholder="Dirección opcional"
                        rows={2}
                      />
                    ) : quote.customerAddress ? (
                      <p className="font-medium flex items-start gap-1">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        {quote.customerAddress}
                      </p>
                    ) : (
                      <p className="text-gray-400 italic">No especificada</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quote Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Resumen de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatMXN(calculatedSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-medium">{formatMXN(calculatedSummary.taxAmount)}</span>
                  </div>
                  
                  <div className="flex justify-between text-green-600">
                    <span>Descuento:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editedQuote.discountAmount || 0}
                          onChange={(e) => setEditedQuote({ 
                            ...editedQuote, 
                            discountAmount: parseFloat(e.target.value) || 0 
                          })}
                          className="w-24 text-right text-sm"
                        />
                      </div>
                    ) : (
                      <span className="font-medium">
                        {calculatedSummary.discountAmount && calculatedSummary.discountAmount > 0 
                          ? `-${formatMXN(calculatedSummary.discountAmount)}`
                          : formatMXN(0)
                        }
                      </span>
                    )}
                  </div>
                  
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatMXN(calculatedSummary.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quote Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Detalles de la Cotización
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500">Número de Cotización</p>
                    <p className="font-medium">{quote.quoteNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fecha de Creación</p>
                    <p className="font-medium">{formatDate(quote.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Válida Hasta</p>
                    <p className="font-medium">{formatDate(quote.validUntil)}</p>
                  </div>
                  {quote.deliveryDate && (
                    <div>
                      <p className="text-gray-500">Fecha de Entrega</p>
                      <p className="font-medium">{formatDate(quote.deliveryDate)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Creado por</p>
                    <p className="font-medium">{quote.user.name}</p>
                    {quote.user.companyName && (
                      <p className="text-xs text-gray-400">{quote.user.companyName}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
