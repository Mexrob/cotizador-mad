
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { formatMXN, formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  Download,
  FileSpreadsheet,
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
  Search,
  RefreshCw,
  Pencil,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
// TODO: Re-implementar configurador de productos
// import ProductSelectorDialog from '@/components/product-selector-dialog'
// import ProductConfigurator from '@/components/product-configurator'
import { KitWizard, WizardState } from '@/components/kit-wizard'
import FileUpload from '@/components/file-upload'

interface Quote {
  id: string
  quoteNumber: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED' | 'SENT_TO_CLIENT' | 'APPROVED_BY_CLIENT' | 'PAID' | 'IN_PRODUCTION' | 'READY_FOR_DELIVERY' | 'INVOICED' | 'COMPLETED' | 'CANCELLED'
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
  attachments?: string[]
  createdAt: string
  updatedAt: string
  items: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    pricePerSquareMeter?: number
    packagingCost: number
    customWidth?: number
    customHeight?: number
    customDepth?: number
    productLineId?: string
    productToneId?: string
    handleModelId?: string
    isTwoSided?: boolean
    isExhibition?: boolean
    isExpressDelivery?: boolean
    edgeBanding?: string
    ceramicColor?: string
    productLine?: {
      id: string
      name: string
    }
    productTone?: {
      id: string
      name: string
      hexColor?: string
    }
    handleModel?: {
      id: string
      name: string
      model: string
      finish: string
      price: number
    }
    product: {
      id: string
      name: string
      sku: string
      lineId?: string
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
    woodGrain?: {
      id: string
      name: string
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

type QuoteItem = Quote['items'][number];

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [quote, setQuote] = useState<Quote | null>(null)

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
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
  const [showProductSelector, setShowProductSelector] = useState(false)
  const [showKitWizard, setShowKitWizard] = useState(false)
  const [showAlhuWizard, setShowAlhuWizard] = useState(false)
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [kitWizardInitialState, setKitWizardInitialState] = useState<WizardState | undefined>(undefined)
  const [showEditConfigurator, setShowEditConfigurator] = useState(false)
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

  const fetchQuote = async (background = false) => {
    try {
      if (!background) {
        setLoading(true)
      }
      setError(null)

      const response = await fetch(`/api/quotes/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setQuote(data.data)
      } else {
        setError(data.error || 'Error al cargar la cotización')
      }
    } catch (err) {
      if (!background) {
        setError('Error de conexión al cargar la cotización')
      }
      console.error('Error fetching quote:', err)
    } finally {
      if (!background) {
        setLoading(false)
      }
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

  const toggleItemDetails = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
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

  const handleEditItem = (item: QuoteItem) => {
    if (item.product.isCustomizable) {
      // Construct WizardState from item
      const initialState: WizardState = {
        category: 'Puertas', // Default
        line: (item.productLine?.name as any) || 'Vidrio',
        dimensions: {
          width: item.customWidth || 0,
          height: item.customHeight || 0,
          quantity: item.quantity
        },
        frontDimensions: { width: 0, height: 0 },
        tone: item.productTone?.name || null,
        backFace: (item.productLine?.name === 'Europea Sincro' || item.productLine?.name === 'Europea Básica')
          ? (item.woodGrain?.name || 'Vertical') as any
          : (item.isTwoSided ? 'Especialidad' : 'Blanca'),
        edgeBanding: (item.edgeBanding as any) || null,
        optionals: {
          isExhibition: item.isExhibition || false,
          isExpressDelivery: item.isExpressDelivery || false,
          isTwoFaces: item.isTwoSided || false
        },
        handle: item.handleModel?.name || 'No aplica',
        pricing: {
          basePrice: 0,
          handlePrice: 0,
          exhibitionFee: 0,
          expressDeliveryFee: 0,
          subtotal: 0,
          total: item.totalPrice,
          pricePerSquareMeter: item.pricePerSquareMeter || 0
        },
        deliveryDays: item.productLine?.name === 'Cerámica' ? 20 : 0,
        color: item.ceramicColor || null
      }

      setEditingItem(item)
      setKitWizardInitialState(initialState)
      setShowKitWizard(true)
    } else {
      // Logic for standard products if needed
      toast({
        description: 'Edición de productos estándar no implementada aún',
      })
    }
  }

  const handleEditComplete = async (config: any) => {
    if (!editingItem) return

    try {
      const response = await fetch(`/api/quotes/${params.id}/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quantity: config.quantity,
          unitPrice: config.unitPrice,
          totalPrice: config.totalPrice,
          customWidth: config.width,
          customHeight: config.height,
          lineId: config.lineId,
          toneId: config.toneId,
          handleId: config.handleId,
          cars: config.cars,
          backFace: config.backFace, // For Europea grain direction
          isExhibition: config.isExhibition,
          isExpressDelivery: config.isExpressDelivery,
          ceramicColor: config.color,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Update itemQuantities if in editing mode
        if (isEditing) {
          setItemQuantities(prev => ({
            ...prev,
            [editingItem.id]: config.quantity
          }))
        }

        toast({
          title: 'Éxito',
          description: 'Producto actualizado exitosamente',
        })
        setShowEditConfigurator(false)
        setEditingItem(null)
        await fetchQuote()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Error al actualizar producto',
        })
      }
    } catch (error) {
      console.error('Error updating item:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Error al actualizar producto',
      })
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
        totalAmount: 0,
        exhibitionFees: 0,
        expressDeliveryFees: 0,
        discountAmount: 0,
        subtotalWithFees: 0,
        baseProductSubtotal: 0,
        handlesSubtotal: 0
      }
    }

    // Calculate base product subtotal, handles subtotal, and additional fees
    const { baseProductSubtotal, handlesSubtotal, backFaceSubtotal, exhibitionFees, expressDeliveryFees } = quote.items.reduce((acc, item) => {
      const currentQuantity = itemQuantities[item.id] !== undefined
        ? itemQuantities[item.id]
        : item.quantity

      const handlePrice = item.handleModel?.price || 0
      // item.unitPrice includes handlePrice, so we subtract it to get base unit price
      // Note: unitPrice from DB currently excludes backFaceFee, so this extraction is safe for Base+Handle legacy logic
      const baseUnitPrice = (item.unitPrice || 0) - handlePrice

      const itemBaseTotal = baseUnitPrice * currentQuantity
      const itemHandleTotal = handlePrice * currentQuantity

      // Back face fee (flat $100 per line item if isTwoSided/Especialidad)
      // Assuming the fee is per line item (kit), not per unit quantity, matching KitWizard logic
      const itemBackFaceTotal = item.isTwoSided ? 100 : 0

      // Effective subtotal for this item (Base + Handle + BackFace)
      const itemSubtotal = itemBaseTotal + itemHandleTotal + itemBackFaceTotal

      // Calculate optional fees percentages based on itemSubtotal
      // Exhibition: -25% (Discount)
      const itemExhibitionFee = item.isExhibition ? itemSubtotal * -0.25 : 0

      // Express: +20% (Surcharge)
      const itemExpressFee = item.isExpressDelivery ? itemSubtotal * 0.20 : 0

      acc.baseProductSubtotal += itemBaseTotal
      acc.handlesSubtotal += itemHandleTotal
      acc.backFaceSubtotal += itemBackFaceTotal
      acc.exhibitionFees += itemExhibitionFee
      acc.expressDeliveryFees += itemExpressFee

      return acc
    }, {
      baseProductSubtotal: 0,
      handlesSubtotal: 0,
      backFaceSubtotal: 0,
      exhibitionFees: 0,
      expressDeliveryFees: 0
    })

    const subtotalWithFees = baseProductSubtotal + handlesSubtotal + backFaceSubtotal + exhibitionFees + expressDeliveryFees

    // Calculate tax (16%)
    const taxAmount = subtotalWithFees * 0.16

    // Apply discount
    const discountAmount = (isEditing ? (editedQuote.discountAmount || 0) : (quote.discountAmount || 0))

    // Calculate total
    const totalAmount = subtotalWithFees + taxAmount - discountAmount

    return {
      subtotal: subtotalWithFees,
      taxAmount,
      totalAmount,
      discountAmount,
      exhibitionFees,
      expressDeliveryFees,
      baseProductSubtotal,
      handlesSubtotal,
      backFaceSubtotal
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

  const handleConfiguredProductAdd = async (config: any) => {
    try {
      const response = await fetch(`/api/quotes/${params.id}/items/configured`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      const data = await response.json()

      if (data.success) {
        await fetchQuote()
        toast({
          title: 'Producto configurado agregado',
          description: 'El producto personalizado ha sido agregado a la cotización',
        })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      console.error('Error adding configured product:', err)
      toast({
        title: 'Error',
        description: 'Error al agregar el producto configurado',
        variant: 'destructive',
      })
    }
  }

  const handleStandardProductAdd = () => {
    setShowProductSelector(false)
    setShowAddProductModal(true)
  }

  const handleKitWizardComplete = async (wizardState: WizardState) => {
    try {
      const config = {
        category: wizardState.category,
        line: wizardState.line,
        dimensions: wizardState.dimensions,
        frontDimensions: wizardState.frontDimensions,
        tone: wizardState.tone,
        backFace: wizardState.backFace,
        edgeBanding: wizardState.edgeBanding,
        handle: wizardState.handle,
        isExhibition: wizardState.optionals.isExhibition,
        isExpressDelivery: wizardState.optionals.isExpressDelivery,
        optionals: wizardState.optionals, // Add this for Alhú API
        pricing: wizardState.pricing,
        pricePerSquareMeter: wizardState.pricing.pricePerSquareMeter,
        color: wizardState.color,
      }


      // Determine the endpoint and method
      let url: string
      let method: string

      if (editingItem) {
        // When editing, check the line type and use specific endpoint
        if (wizardState.line === 'Super Mate') {
          url = `/api/quotes/${params.id}/items/super-mate/${editingItem.id}`
          method = 'PUT'
        } else if (wizardState.line === 'Alto Brillo') {
          url = `/api/quotes/${params.id}/items/alto-brillo/${editingItem.id}`
          method = 'PUT'
        } else if (wizardState.line === 'Europea Básica') {
          url = `/api/quotes/${params.id}/items/europea/${editingItem.id}`
          method = 'PUT'
        } else if (wizardState.line === 'Europea Sincro') {
          url = `/api/quotes/${params.id}/items/europea-sincro/${editingItem.id}`
          method = 'PUT'
        } else if (wizardState.line === 'Línea Alhú') {
          url = `/api/quotes/${params.id}/items/alhu/${editingItem.id}`
          method = 'PUT'
        } else {
          // Default to generic kit endpoint
          url = `/api/quotes/${params.id}/items/kit/${editingItem.id}`
          method = 'PUT'
        }
      } else {
        // When creating new items
        method = 'POST'
        if (wizardState.line === 'Línea Alhú') {
          url = `/api/quotes/${params.id}/items/alhu`
        } else if (wizardState.line === 'Europea Básica') {
          url = `/api/quotes/${params.id}/items/europea`
        } else if (wizardState.line === 'Europea Sincro') {
          url = `/api/quotes/${params.id}/items/europea-sincro`
        } else if (wizardState.line === 'Alto Brillo') {
          url = `/api/quotes/${params.id}/items/alto-brillo`
        } else if (wizardState.line === 'Super Mate') {
          url = `/api/quotes/${params.id}/items/super-mate`
        } else {
          url = `/api/quotes/${params.id}/items/kit`
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      // Handle specific HTTP status codes
      if (!response.ok) {
        let errorMessage = 'Error al guardar el kit configurado'
        let errorTitle = 'Error'

        switch (response.status) {
          case 401:
            errorTitle = 'Sesión expirada'
            errorMessage = 'Tu sesión ha expirado. Por favor, recarga la página e inicia sesión nuevamente.'
            break
          case 403:
            errorTitle = 'Acceso denegado'
            errorMessage = 'No tienes permisos para realizar esta acción.'
            break
          case 404:
            errorTitle = 'Recurso no encontrado'
            errorMessage = 'No se encontró la línea de producto seleccionada. Por favor, contacta al administrador.'
            break
          case 500:
            errorTitle = 'Error del servidor'
            errorMessage = 'Ocurrió un error en el servidor. Por favor, intenta nuevamente.'
            break
          default:
            // Try to get error message from response
            try {
              const data = await response.json()
              if (data.error) {
                errorMessage = data.error
              }
            } catch {
              // If we can't parse the response, use default message
            }
        }

        toast({
          title: errorTitle,
          description: errorMessage,
          variant: 'destructive',
        })
        return
      }

      const data = await response.json()

      if (data.success) {
        await fetchQuote()
        setShowKitWizard(false)
        setEditingItem(null)
        setKitWizardInitialState(undefined)
        toast({
          title: editingItem ? 'Kit actualizado' : 'Kit agregado',
          description: editingItem ? 'El kit ha sido actualizado exitosamente' : 'El kit personalizado ha sido agregado a la cotización',
        })
      } else {
        throw new Error(data.error || 'Error desconocido al guardar el kit')
      }
    } catch (err) {
      console.error('Error adding/updating kit:', err)

      // Handle network errors
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar el kit configurado'

      toast({
        title: 'Error',
        description: errorMessage,
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

  const handleDownloadExcel = async () => {
    try {
      toast({
        title: 'Descargando Excel...',
        description: 'Se descargará el archivo Excel',
      })

      // Download the Excel file
      const excelUrl = `/api/quotes/${params.id}/excel`
      const link = document.createElement('a')
      link.href = excelUrl
      link.download = `cotizacion-${quote?.quoteNumber}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: 'Excel descargado',
        description: 'La cotización se ha descargado exitosamente',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error al descargar el Excel',
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
          color: 'bg-gray-100 text-gray-800 border-gray-200',
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
      case 'PAID':
        return {
          label: 'Pagada',
          icon: Check,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-module-black mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando cotización...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Error al cargar cotización
            </h2>
            <p className="text-muted-foreground mb-6">
              {error || 'La cotización no fue encontrada'}
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button onClick={() => fetchQuote()}>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-module-black to-module-dark text-white py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
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

              <div className="flex-1 min-w-0">
                <motion.h1
                  className="text-xl sm:text-2xl md:text-3xl font-bold truncate"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {quote.projectName}
                </motion.h1>
                <motion.p
                  className="text-sm sm:text-base text-gray-100 flex flex-wrap items-center gap-2"
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
              className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto"
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
                      PDF
                    </Button>
                    <Button
                      onClick={handleDownloadExcel}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Excel
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

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Project Information */}


            {/* Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      <span className="text-base sm:text-lg">Productos ({quote.items.length})</span>
                    </div>
                    {isEditing && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowKitWizard(true)}
                          className="w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          <span className="text-sm">Configurar Kit</span>
                        </Button>
                        <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
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
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                  <h4 className="font-medium text-foreground mb-2">Vista Previa del Cálculo</h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Cantidad: <span className="font-medium">{newProductQuantity} unidades</span></p>
                                      <p className="text-muted-foreground">Dimensiones: <span className="font-medium">{newProductWidth || '0'}mm × {newProductHeight || '0'}mm</span></p>
                                      <p className="text-muted-foreground">Área por unidad: <span className="font-medium">{areaInSquareMeters.toFixed(4)} m²</span></p>
                                    </div>
                                    <div>
                                      {(() => {
                                        const selectedProduct = availableProducts.find(p => p.id === selectedProductId);
                                        if (selectedProduct && selectedProduct.isCustomizable) {
                                          const standardArea = (selectedProduct.width / 1000) * (selectedProduct.height / 1000);
                                          const pricePerSquareMeter = selectedProductPrice / standardArea;
                                          return (
                                            <>
                                              <p className="text-muted-foreground">Precio base por unidad estándar: <span className="font-medium">{formatBasePriceMXN(selectedProductPrice)}</span></p>
                                              <p className="text-muted-foreground">Dimensión estándar: <span className="font-medium">{selectedProduct.width}mm × {selectedProduct.height}mm ({standardArea.toFixed(4)} m²)</span></p>
                                              <p className="text-muted-foreground">Precio por m²: <span className="font-medium">{formatMXN(pricePerSquareMeter)}</span></p>
                                            </>
                                          );
                                        } else {
                                          return <p className="text-muted-foreground">Precio base: <span className="font-medium">{formatBasePriceMXN(selectedProductPrice)} / unidad</span></p>;
                                        }
                                      })()}
                                      <p className="text-muted-foreground">Precio por unidad: <span className="font-medium">{formatMXN(pricePerUnit)}</span></p>
                                      <p className="text-foreground font-semibold text-lg">Precio Total: {formatMXN(totalPrice)}</p>
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
                      </>
                    )}

                  </CardTitle>
                </CardHeader>
                <CardContent>

                  <div className="rounded-md border overflow-x-auto">
                    <Table className="border-collapse">
                      <TableHeader>
                        <TableRow className="border-b">
                          {isEditing && <TableHead className="w-[100px] border-r">Acciones</TableHead>}
                          <TableHead className="w-[200px] border-r">Producto</TableHead>
                          <TableHead className="border-r">Marca</TableHead>
                          <TableHead className="border-r">Color</TableHead>
                          {quote.items.some(i => i.productLine?.name?.includes('Europea')) && (
                            <TableHead className="border-r">Veta</TableHead>
                          )}
                          <TableHead className="text-right border-r">Alto</TableHead>
                          <TableHead className="text-right border-r">Ancho</TableHead>
                          <TableHead className="text-right border-r">Costo unitario</TableHead>
                          <TableHead className="text-right border-r">Cantidad</TableHead>
                          <TableHead className="text-center border-r">Caras</TableHead>
                          <TableHead className="text-center border-r">Cubrecanto</TableHead>
                          <TableHead className="border-r">Jaladera</TableHead>
                          <TableHead className="text-right border-r">Precio Jaladera</TableHead>
                          <TableHead className="text-right border-r">Cant. Jaladera</TableHead>
                          <TableHead className="text-right border-r">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {quote.items.map((item) => {
                          const width = item.customWidth || item.product.width || 0
                          const height = item.customHeight || item.product.height || 0
                          const handlePrice = item.handleModel?.price || 0

                          // Calculate unit cost: (height × width × price per m²) ÷ 1,000,000
                          const pricePerM2 = item.pricePerSquareMeter || 0
                          const unitCost = (height * width * pricePerM2) / 1000000

                          return (
                            <TableRow key={item.id} className="border-b">
                              {isEditing && (
                                <TableCell className="border-r">
                                  <div className="flex items-center justify-start gap-1">
                                    {item.product.isCustomizable && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEditItem(item)}
                                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                      >
                                        <Pencil className="w-4 h-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setItemToDelete(item.id)}
                                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                              <TableCell className="border-r">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {item.product.thumbnail ? (
                                      <Image
                                        src={item.product.thumbnail}
                                        alt={item.product.name}
                                        width={40}
                                        height={40}
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <Package className="w-5 h-5 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-sm truncate" title={item.product.name}>{item.product.name}</div>
                                    <div className="text-xs text-muted-foreground truncate">{item.product.sku}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="border-r text-sm">
                                {item.productTone?.name || '-'}
                              </TableCell>
                              <TableCell className="border-r text-sm">
                                {item.ceramicColor || '-'}
                              </TableCell>
                              {quote.items.some(i => i.productLine?.name?.includes('Europea')) && (
                                <TableCell className="border-r text-sm">
                                  {item.woodGrain?.name || (
                                    // Fallback for older items that might have stored direction in backFace or implied by isTwoSided?
                                    // But based on my fix, backFace is restored from woodGrain.
                                    // If strictly relying on woodGrain relation:
                                    '-'
                                  )}
                                </TableCell>
                              )}
                              <TableCell className="text-right text-sm border-r">
                                {height > 0 ? `${height} mm` : '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm border-r">
                                {width > 0 ? `${width} mm` : '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm border-r">{formatMXN(unitCost)}</TableCell>
                              <TableCell className="text-right border-r">
                                <span className="text-sm">{item.quantity}</span>
                              </TableCell>
                              <TableCell className="text-center text-sm border-r">
                                {item.isTwoSided ? '2' : '1'}
                              </TableCell>
                              <TableCell className="text-center border-r text-sm">
                                {item.edgeBanding || '-'}
                              </TableCell>
                              <TableCell className="text-sm border-r">
                                {item.handleModel ? (
                                  <div className="flex flex-col">
                                    <span className="truncate" title={item.handleModel.model}>{item.handleModel.model}</span>
                                    <span className="text-[10px] text-muted-foreground truncate">{item.handleModel.finish}</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm border-r">
                                {item.handleModel ? formatMXN(item.handleModel.price) : '-'}
                              </TableCell>
                              <TableCell className="text-right text-sm border-r">
                                {item.handleModel ? item.quantity : '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium text-sm border-r">{formatMXN(item.totalPrice)}</TableCell>

                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* File Attachments - Moved here from sidebar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Archivos Adjuntos</CardTitle>
                  <p className="text-sm text-gray-500">Adjunte aquí la imagen o archivo de su comprobante de pago</p>
                </CardHeader>
                <CardContent>
                  <FileUpload
                    quoteId={quote.id}
                    existingFiles={quote.attachments || []}
                    onUploadComplete={(fileUrl) => {
                      // Refresh quote data in background
                      fetchQuote(true)
                    }}
                    onDeleteFile={(fileUrl) => {
                      // Refresh quote data in background
                      fetchQuote(true)
                    }}
                    disabled={false} // Always enabled for uploads (e.g. payment proof)
                  />
                </CardContent>
              </Card>
            </motion.div>
          </div >

          {/* Sidebar */}
          < div className="space-y-6" >
            {/* Customer Information */}
            < motion.div
              initial={{ opacity: 0, y: 20 }
              }
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
            </motion.div >

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

                  {quote.roomDimensions && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Dimensiones de la Cocina</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-module-black mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Ancho</p>
                          <p className="font-semibold">{quote.roomDimensions.width}m</p>
                        </div>
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-module-black mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Alto</p>
                          <p className="font-semibold">{quote.roomDimensions.height}m</p>
                        </div>
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-module-black mx-auto mb-1" />
                          <p className="text-sm text-gray-500">Profundidad</p>
                          <p className="font-semibold">{quote.roomDimensions.depth}m</p>
                        </div>
                        <div className="text-center">
                          <Ruler className="w-5 h-5 text-module-black mx-auto mb-1" />
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

            {/* Quote Summary */}
            < motion.div
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
                    <span className="text-muted-foreground">Subtotal Productos:</span>
                    <span className="font-medium">{formatMXN(calculatedSummary.baseProductSubtotal)}</span>
                  </div>

                  {calculatedSummary.handlesSubtotal > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jaladeras:</span>
                      <span className="font-medium">{formatMXN(calculatedSummary.handlesSubtotal)}</span>
                    </div>
                  )}

                  {(calculatedSummary.backFaceSubtotal || 0) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Acabado Especial:</span>
                      <span className="font-medium">{formatMXN(calculatedSummary.backFaceSubtotal || 0)}</span>
                    </div>
                  )}

                  {calculatedSummary.exhibitionFees !== 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Producto de Exhibición (-25%):</span>
                      <span className="font-medium text-green-600">{formatMXN(calculatedSummary.exhibitionFees)}</span>
                    </div>
                  )}

                  {calculatedSummary.expressDeliveryFees > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envío Express (+20%):</span>
                      <span className="font-medium text-blue-600">+{formatMXN(calculatedSummary.expressDeliveryFees)}</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">{formatMXN(calculatedSummary.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA (16%):</span>
                    <span className="font-medium">{formatMXN(calculatedSummary.taxAmount)}</span>
                  </div>

                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatMXN(calculatedSummary.totalAmount)}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div >

            {/* Quote Details */}
            < motion.div
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
            </motion.div >
          </div >
        </div >

        {/* TODO: Re-implementar Product Selector Dialog */}
        {/* 
        <ProductSelectorDialog
          open={showProductSelector}
          onOpenChange={setShowProductSelector}
          onConfiguredProductAdd={handleConfiguredProductAdd}
          onStandardProductAdd={handleStandardProductAdd}
        />
        */}


        {/* Kit Wizard Dialog */}
        <Dialog open={showKitWizard} onOpenChange={setShowKitWizard}>
          <DialogContent className="max-w-6xl h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Configurador de Kits</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <KitWizard
                key={editingItem?.id || `new-${Date.now()}`}
                initialState={kitWizardInitialState}
                onComplete={handleKitWizardComplete}
                onCancel={() => {
                  setShowKitWizard(false)
                  setEditingItem(null)
                  setKitWizardInitialState(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. Esto eliminará permanentemente el producto de la cotización.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (itemToDelete) {
                    deleteItem(itemToDelete)
                    setItemToDelete(null)
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* TODO: Re-implementar Product Configurator para edición */}
        {/*
        <Dialog open={showEditConfigurator} onOpenChange={setShowEditConfigurator}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            {editingItem && (
              <>
                <ProductConfigurator
                  mode="edit"
                  initialConfig={{
                    productId: editingItem.product.id,
                    width: editingItem.customWidth || 0,
                    height: editingItem.customHeight || 0,
                    quantity: editingItem.quantity,
                    lineId: editingItem.productLineId,
                    toneId: editingItem.productToneId,
                    handleId: editingItem.handleModelId,
                    cars: editingItem.isTwoSided ? 2 : 1,
                    isExhibition: editingItem.isExhibition || false,
                    isExpressDelivery: editingItem.isExpressDelivery || false,
                  }}
                  onComplete={handleEditComplete}
                  onCancel={() => setShowEditConfigurator(false)}
                  allowedLines={['Vidrio']}
                  allowedHandles={['Sorento A', 'Sorento L', 'Sorento G']}
                  allowedTones={[
                    'Blanco Brillante',
                    'Blanco Mate',
                    'Paja Brillante',
                    'Paja Mate',
                    'Capuchino Brillante',
                    'Capuchino Mate',
                    'Humo Brillante',
                    'Humo Mate',
                    'Gris Brillante',
                    'Gris Mate',
                    'Rojo Brillante',
                    'Rojo Mate',
                    'Negro Brillante',
                    'Negro Mate'
                  ]}
                />
              </>
            )}
          </DialogContent>
        </Dialog>
        */}
      </div >
    </div >
  )
}
