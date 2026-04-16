
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'


const ConfigurableWizard = dynamic(() => import('@/components/configurable-wizard').then(m => m.ConfigurableWizard), { ssr: false })
const VidrioWizard = dynamic(() => import('@/components/vidrio-wizard/vidrio-wizard'), { ssr: false })
const CeramicaWizard = dynamic(() => import('@/components/ceramica-wizard/ceramica-wizard'), { ssr: false })
const AltoBrilloWizard = dynamic(() => import('@/components/alto-brillo-wizard/alto-brillo-wizard'), { ssr: false })
const SuperMateWizard = dynamic(() => import('@/components/super-mate-wizard/super-mate-wizard'), { ssr: false })
const AlhuWizard = dynamic(() => import('@/components/alhu-wizard/alhu-wizard'), { ssr: false })
const EuropaBasicaWizard = dynamic(() => import('@/components/europa-basica-wizard/europa-basica-wizard'), { ssr: false })
const EuropaSincroWizard = dynamic(() => import('@/components/europa-sincro-wizard/europa-sincro-wizard'), { ssr: false })
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
import { useToast } from '@/hooks/use-toast'
import SmartWizard from '@/components/smart-wizard/smart-wizard'
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
  const [showProductCatalog, setShowProductCatalog] = useState(false)
  const [editingItem, setEditingItem] = useState<QuoteItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<string | null>(null)
  const [showEditConfigurator, setShowEditConfigurator] = useState(false)
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [newProductQuantity, setNewProductQuantity] = useState(1)
  const [newProductWidth, setNewProductWidth] = useState('')
  const [newProductHeight, setNewProductHeight] = useState('')
  const [showSmartWizard, setShowSmartWizard] = useState(false)
  const [showVidrioWizard, setShowVidrioWizard] = useState(false)
  const [showCeramicaWizard, setShowCeramicaWizard] = useState(false)
  const [showAlhuWizard, setShowAlhuWizard] = useState(false)
  const [showEuropaBasicaWizard, setShowEuropaBasicaWizard] = useState(false)
  const [showEuropaSincroWizard, setShowEuropaSincroWizard] = useState(false)
  const [showAltoBrilloWizard, setShowAltoBrilloWizard] = useState(false)
  const [altoBrilloWizardInitialData, setAltoBrilloWizardInitialData] = useState<any>(undefined)
  const [showSuperMateWizard, setShowSuperMateWizard] = useState(false)
  const [superMateWizardInitialData, setSuperMateWizardInitialData] = useState<any>(undefined)
  const [vidrioWizardInitialData, setVidrioWizardInitialData] = useState<any>(undefined)
  const [ceramicaWizardInitialData, setCeramicaWizardInitialData] = useState<any>(undefined)
  const [alhuWizardInitialData, setAlhuWizardInitialData] = useState<any>(undefined)
  const [europaBasicaWizardInitialData, setEuropaBasicaWizardInitialData] = useState<any>(undefined)
  const [europaSincroWizardInitialData, setEuropaSincroWizardInitialData] = useState<any>(undefined)

  useEffect(() => {
    if (params.id) {
      fetchQuote()
      fetchCompanySettings()
      // Preload products for wizards to improve initial load time
      prefetchWizardsData()
    }
  }, [params.id])

  const prefetchWizardsData = async () => {
    try {
      // Prefetch all product lines needed by wizards in parallel
      await Promise.all([
        fetch('/api/products?linea=cmm84mnhv0000le11rk32wdq1&limit=100', { cache: 'force-cache' }),
        fetch('/api/products?search=Cerámica&limit=100', { cache: 'force-cache' }),
        fetch('/api/products?linea=Alhú&limit=100', { cache: 'force-cache' }),
        fetch('/api/products?linea=Europa%20Básica&limit=100', { cache: 'force-cache' }),
        fetch('/api/products?linea=Europa%20Sincro&limit=100', { cache: 'force-cache' }),
        fetch('/api/handle-models', { cache: 'force-cache' }),
      ])
    } catch (error) {
      console.error('Error prefetching wizards data:', error)
    }
  }

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
        setAvailableProducts(data.products || [])
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

  const renderItemTable = (item: any) => {
    const width = item.customWidth || item.product.width || 0
    const height = item.customHeight || item.product.height || 0
    const area = width && height ? ((width * height / 1000000) * item.quantity).toFixed(2) : '-'
    const lineName = item.productLine?.name?.toLowerCase() || ''
    const isVidrio = lineName.includes('vidrio')
    const isCeramica = lineName.includes('cerám')
    const isAlhu = lineName.includes('alh')
    const isEuropaBasica = lineName.includes('europa') && lineName.includes('básica')
    const isEuropaSincro = lineName.includes('europa') && lineName.includes('sincro')
    const isAltoBrillo = lineName.includes('alto brillo') || (lineName.includes('alto') && lineName.includes('brillo'))
    const isSuperMate = lineName.includes('super mate') || lineName.includes('super-mate')
    
    const vetaOrientation = (item as any)?.vetaOrientation || item.woodGrain?.name || (item.isTwoSided ? 'Vertical' : null)
    const hasVetaOrientation = vetaOrientation && typeof vetaOrientation === 'string' && vetaOrientation.trim() !== ''
    const faces = item.isTwoSided ? '2' : '1'
    
    if (isAltoBrillo) {
      const expressAmount = (item as any).expressAmount || 0
      const exhibitionAmount = (item as any).exhibitionAmount || 0
      const handlePrice = (item as any).handlePrice || (item as any).packagingCost || 0
      const handleOrientation = (item as any).jaladeraOrientation || (item as any).handleOrientation || null
      const subtotal = item.totalPrice - expressAmount + exhibitionAmount
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tono</TableHead>
              <TableHead>Dimensiones</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Área total</TableHead>
              <TableHead>Costo unitario</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Caras</TableHead>
              <TableHead>Cubrecanto</TableHead>
              <TableHead>Jaladera</TableHead>
              <TableHead>Orientación jaladera</TableHead>
              <TableHead>Costo Jaladera</TableHead>
              <TableHead>Envío express (+20%)</TableHead>
              <TableHead>Desc. exhibición (-25%)</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{item.productTone?.name || item.ceramicColor || item.product?.name?.split('-')[1]?.trim() || '-'}</TableCell>
              <TableCell>{height > 0 && width > 0 ? `${height} x ${width} mm` : '-'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{area} m²</TableCell>
              <TableCell>{formatMXN(item.unitPrice)}</TableCell>
              <TableCell>{formatMXN(subtotal)}</TableCell>
              <TableCell>{faces}</TableCell>
              <TableCell>{item.edgeBanding || '-'}</TableCell>
              <TableCell>{(item as any).jaladera || item.handleModel?.name || '-'}</TableCell>
              <TableCell>{handleOrientation ? (handleOrientation === 'vertical' ? 'Vertical' : 'Horizontal') : '-'}</TableCell>
              <TableCell>{handlePrice > 0 ? formatMXN(handlePrice) : '-'}</TableCell>
              <TableCell>{expressAmount > 0 ? '+' + formatMXN(expressAmount) : '-'}</TableCell>
              <TableCell>{exhibitionAmount > 0 ? '-' + formatMXN(exhibitionAmount) : '-'}</TableCell>
              <TableCell className="font-bold">{formatMXN(item.totalPrice)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (isSuperMate) {
      const expressAmount = (item as any).expressAmount || 0
      const exhibitionAmount = (item as any).exhibitionAmount || 0
      const handlePrice = (item as any).handlePrice || (item as any).packagingCost || 0
      const handleOrientation = (item as any).jaladeraOrientation || (item as any).handleOrientation || null
      const subtotal = item.totalPrice - expressAmount + exhibitionAmount
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tono</TableHead>
              <TableHead>Dimensiones</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Área total</TableHead>
              <TableHead>Costo unitario</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Caras</TableHead>
              <TableHead>Cubrecanto</TableHead>
              <TableHead>Jaladera</TableHead>
              <TableHead>Orientación jaladera</TableHead>
              <TableHead>Costo Jaladera</TableHead>
              <TableHead>Envío express (+20%)</TableHead>
              <TableHead>Desc. exhibición (-25%)</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{item.productTone?.name || item.ceramicColor || item.product?.name?.split('-')[1]?.trim() || '-'}</TableCell>
              <TableCell>{height > 0 && width > 0 ? `${height} x ${width} mm` : '-'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{area} m²</TableCell>
              <TableCell>{formatMXN(item.unitPrice)}</TableCell>
              <TableCell>{formatMXN(subtotal)}</TableCell>
              <TableCell>{faces}</TableCell>
              <TableCell>{item.edgeBanding || '-'}</TableCell>
              <TableCell>{(item as any).jaladera || item.handleModel?.name || '-'}</TableCell>
              <TableCell>{handleOrientation ? (handleOrientation === 'vertical' ? 'Vertical' : 'Horizontal') : '-'}</TableCell>
              <TableCell>{handlePrice > 0 ? formatMXN(handlePrice) : '-'}</TableCell>
              <TableCell>{expressAmount > 0 ? '+' + formatMXN(expressAmount) : '-'}</TableCell>
              <TableCell>{exhibitionAmount > 0 ? '-' + formatMXN(exhibitionAmount) : '-'}</TableCell>
              <TableCell className="font-bold">{formatMXN(item.totalPrice)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (isEuropaBasica || isEuropaSincro) {
      const handlePrice = (item as any).handlePrice || (item as any).packagingCost || 0
      const expressAmount = (item as any).expressAmount || 0
      const exhibitionAmount = (item as any).exhibitionAmount || 0
      const handleOrientation = (item as any).handleOrientation || (item as any).jaladeraOrientation || null
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Tono/Color</TableHead>
              <TableHead>Orientación veta</TableHead>
              <TableHead>Dimensiones</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Área total</TableHead>
              <TableHead>Costo unitario</TableHead>
              <TableHead>Caras</TableHead>
              <TableHead>Cubrecanto</TableHead>
              <TableHead>Jaladera</TableHead>
              <TableHead>Orientación jaladera</TableHead>
              <TableHead>Costo Jaladera</TableHead>
              <TableHead>Envío express (+20%)</TableHead>
              <TableHead>Desc. exhibición (-25%)</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{item.productLine?.name || item.product?.name?.split('-')[0]?.trim() || '-'}</TableCell>
              <TableCell>{item.productTone?.name || item.ceramicColor || '-'}</TableCell>
              <TableCell>{hasVetaOrientation ? vetaOrientation : '-'}</TableCell>
              <TableCell>{height > 0 ? `${height} x ${width} mm` : '-'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{area} m²</TableCell>
              <TableCell>{formatMXN(item.unitPrice)}</TableCell>
              <TableCell>{faces}</TableCell>
              <TableCell>{item.edgeBanding || '-'}</TableCell>
              <TableCell>{(item as any).jaladera || item.handleModel?.name || '-'}</TableCell>
              <TableCell>{handleOrientation ? (handleOrientation === 'vertical' ? 'Vertical' : 'Horizontal') : '-'}</TableCell>
              <TableCell>{handlePrice > 0 ? formatMXN(handlePrice) : '-'}</TableCell>
              <TableCell>{expressAmount > 0 ? '+' + formatMXN(expressAmount) : '-'}</TableCell>
              <TableCell>{exhibitionAmount > 0 ? '-' + formatMXN(exhibitionAmount) : '-'}</TableCell>
              <TableCell className="font-bold">{formatMXN(item.totalPrice)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (isCeramica) {
      const handlePrice = (item as any).handlePrice || (item as any).packagingCost || 0
      const expressAmount = (item as any).expressAmount || 0
      const exhibitionAmount = (item as any).exhibitionAmount || 0
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dimensiones</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Área total</TableHead>
              <TableHead>Costo unitario</TableHead>
              <TableHead>Caras</TableHead>
              <TableHead>Orientación veta</TableHead>
              <TableHead>Cubrecanto</TableHead>
              <TableHead>Jaladera</TableHead>
              <TableHead>Orientación</TableHead>
              <TableHead>Costo Jaladera</TableHead>
              <TableHead>Envío express (+20%)</TableHead>
              <TableHead>Producto demostración (-25%)</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{width} x {height} mm</TableCell>
              <TableCell>{item.quantity} unidades</TableCell>
              <TableCell>{area} m²</TableCell>
              <TableCell>{formatMXN(item.unitPrice)}</TableCell>
              <TableCell>{item.ceramicColor || '-'}</TableCell>
              <TableCell>{vetaOrientation}</TableCell>
              <TableCell>{(item as any).cubrecanto || item.edgeBanding || '-'}</TableCell>
              <TableCell>{item.handleModel?.name || item.jaladera || '-'}</TableCell>
              <TableCell>{(item as any).jaladeraOrientation === 'vertical' ? 'Vertical' : (item as any).jaladeraOrientation === 'horizontal' ? 'Horizontal' : '-'}</TableCell>
              <TableCell>{handlePrice > 0 ? formatMXN(handlePrice) : '-'}</TableCell>
              <TableCell>{expressAmount > 0 ? formatMXN(expressAmount) : '-'}</TableCell>
              <TableCell>{exhibitionAmount > 0 ? '-' + formatMXN(exhibitionAmount) : '-'}</TableCell>
              <TableCell className="font-bold">{formatMXN(item.totalPrice)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    if (isVidrio || isAlhu) {
      const expressAmount = (item as any).expressAmount || 0
      const exhibitionAmount = (item as any).exhibitionAmount || 0
      const subtotal = item.totalPrice - expressAmount + exhibitionAmount
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Producto</TableHead>
              <TableHead>Dimensiones</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Área total</TableHead>
              <TableHead>Precio unitario</TableHead>
              <TableHead>Subtotal</TableHead>
              <TableHead>Envío express (+20%)</TableHead>
              <TableHead>Desc. exhibición (-25%)</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>{item.productLine?.name || item.product?.name?.split('-')[0]?.trim() || '-'}</TableCell>
              <TableCell>{height > 0 && width > 0 ? `${height} x ${width} mm` : '-'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{area} m²</TableCell>
              <TableCell>{formatMXN(item.unitPrice)}</TableCell>
              <TableCell>{formatMXN(subtotal)}</TableCell>
              <TableCell>{expressAmount > 0 ? '+' + formatMXN(expressAmount) : '-'}</TableCell>
              <TableCell>{exhibitionAmount > 0 ? '-' + formatMXN(exhibitionAmount) : '-'}</TableCell>
              <TableCell className="font-bold">{formatMXN(item.totalPrice)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alto</TableHead>
            <TableHead>Ancho</TableHead>
            <TableHead>Cantidad</TableHead>
            <TableHead>Color/Tono</TableHead>
            <TableHead>Cubrecanto</TableHead>
            <TableHead>Jaladera</TableHead>
            <TableHead>Orientación Veta</TableHead>
            <TableHead>Envío Express</TableHead>
            <TableHead>Exhibición</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{height} mm</TableCell>
            <TableCell>{width} mm</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>{item.productTone?.name || item.ceramicColor || '-'}</TableCell>
            <TableCell>{item.edgeBanding || '-'}</TableCell>
            <TableCell>{item.handleModel?.name || '-'}</TableCell>
            <TableCell>{vetaOrientation}</TableCell>
            <TableCell>{(item as any).expressAmount ? formatMXN((item as any).expressAmount) : '-'}</TableCell>
            <TableCell>{(item as any).exhibitionAmount ? formatMXN((item as any).exhibitionAmount) : '-'}</TableCell>
            <TableCell className="font-bold">{formatMXN(item.totalPrice)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
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
    if (!item.product) {
      toast({
        title: 'Edición no disponible',
        description: 'Producto no encontrado',
        variant: 'default'
      })
      return
    }

    const lineName = item.productLine?.name?.toLowerCase() || ''
    
    // Normalizamos el mapeo de campos comunes que todos los wizards usan
    const itemData = {
      productId: item.product?.id,
      productName: item.product?.name,
      width: item.customWidth || item.product?.width || 0,
      height: item.customHeight || item.product?.height || 0,
      quantity: item.quantity,
      // Booleanos de opciones (estandarizados)
      expressShipping: !!item.isExpressDelivery,
      demoProduct: !!item.isExhibition,
      isTwoSided: !!item.isTwoSided,
      // Datos adicionales específicos
      handle: (item as any).jaladera || item.handleModel?.name || 'No aplica',
      handleModelId: item.handleModelId || item.handleModel?.id || '',
      handleOrientation: (item as any).jaladeraOrientation || 'vertical',
      handlePrice: item.packagingCost || 0,
      edgeBanding: item.edgeBanding,
      ceramicColor: item.ceramicColor,
      vetaOrientation: (item as any).vetaOrientation,
      jaladera: (item as any).jaladera || item.handleModel?.name || 'none',
      jaladeraOrientation: (item as any).jaladeraOrientation || 'vertical',
      totalPrice: item.totalPrice,
      unitPrice: item.unitPrice,
      // Datos específicos para Alto Brillo
      // Usar ceramicColor primero (es donde se guarda el tono seleccionado)
      toneId: item.productToneId || item.productTone?.id || '',
      tone: item.ceramicColor || item.productTone?.name || (item.product?.name?.includes('-') ? item.product.name.split('-')[1]?.trim() : ''),
      backFace: (item as any).backFace || item.edgeBanding || '',
      backFaceId: (item as any).backFaceId || '',
    }
    
    const isAlhuLine = lineName.includes('alh') || item.product?.name?.toLowerCase().includes('alh') || item.productLine?.name?.toLowerCase().includes('alh')
    
    setEditingItem(item)

    if (isAlhuLine) {
      setAlhuWizardInitialData(itemData)
      setShowAlhuWizard(true)
    } else if (lineName.includes('vidrio')) {
      setVidrioWizardInitialData(itemData)
      setShowVidrioWizard(true)
    } else if (lineName.includes('cerám')) {
      setCeramicaWizardInitialData(itemData)
      setShowCeramicaWizard(true)
    } else if (lineName === 'europa básica') {
      setEuropaBasicaWizardInitialData(itemData)
      setShowEuropaBasicaWizard(true)
    } else if (lineName === 'europa sincro') {
      setEuropaSincroWizardInitialData(itemData)
      setShowEuropaSincroWizard(true)
    } else if (lineName.includes('alto brillo') || lineName.includes('brillo')) {
      setAltoBrilloWizardInitialData(itemData)
      setShowAltoBrilloWizard(true)
    } else if (lineName.includes('super mate') || lineName.includes('super-mate')) {
      setSuperMateWizardInitialData(itemData)
      setShowSuperMateWizard(true)
    } else {
      toast({
        title: 'Edición no disponible',
        description: `La edición para la línea "${item.productLine?.name}" aún no está disponible`,
        variant: 'default'
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
    if (!availableProducts || availableProducts.length === 0) {
      return 0
    }
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

    if (!availableProducts || availableProducts.length === 0) {
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

    // Simply sum the stored values from the database
    const { totalPrices, expressDeliveryFees, exhibitionFees } = quote.items.reduce((acc, item) => {
      const itemAny = item as any
      acc.totalPrices += itemAny.totalPrice || 0
      acc.expressDeliveryFees += itemAny.expressAmount || 0
      acc.exhibitionFees += itemAny.exhibitionAmount || 0
      return acc
    }, {
      totalPrices: 0,
      expressDeliveryFees: 0,
      exhibitionFees: 0
    })

    // Calculate Base Subtotal (Total minus adjustments)
    const baseProductSubtotal = totalPrices - expressDeliveryFees + exhibitionFees

    // Apply manual quote discount
    const quoteDiscount = (isEditing ? (editedQuote.discountAmount || 0) : (quote.discountAmount || 0))

    // Subtotal before tax (Net)
    const subtotal = totalPrices - quoteDiscount

    // Calculate tax (16%)
    const taxAmount = subtotal * 0.16

    // Calculate total
    const totalAmount = subtotal + taxAmount

    return {
      baseProductSubtotal,
      expressDeliveryFees,
      exhibitionFees,
      discountAmount: quoteDiscount,
      subtotal,
      taxAmount,
      totalAmount,
      handlesSubtotal: 0,
      backFaceSubtotal: 0
    }
  }, [quote, isEditing, editedQuote.discountAmount])

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

  const handleNewWizardComplete = async (data: Record<string, unknown>, pricing: { subtotal: number; total: number; adjustments: Array<{ name: string; amount: number }> }) => {
    try {
      const selectedProducts = data.selectedProducts as Array<{ id: string; name: string; price: number }> | undefined
      const productIds = data.productIds as string[] | undefined

      const config = {
        // Mapeo de datos que coincida con lo que el backend espera
        quantity: (data.dimensions as any)?.quantity || 1,
        width: (data.dimensions as any)?.width || 0,
        height: (data.dimensions as any)?.height || 0,
        unitPrice: pricing.total / ((data.dimensions as any)?.quantity || 1), // Aproximación
        totalPrice: pricing.total,
        lineId: data.lineId,
        toneId: data.toneId,
        handleId: data.handleId,
        // ... otros campos
        isExhibition: (data.optionals as any)?.isExhibition,
        isExpressDelivery: (data.optionals as any)?.isExpressDelivery,
        isTwoSided: (data.optionals as any)?.isTwoFaces,
        ceramicColor: data.color,
      }

      // Persistir la partida en la base de datos
      const response = await fetch(`/api/quotes/${params.id}/items/configured`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      const result = await response.json()

      if (result.success) {
        await fetchQuote() // Refresca la tabla automáticamente
        setEditingItem(null)
        toast({
          title: 'Éxito',
          description: 'Partida agregada a la cotización',
        })
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo guardar la partida',
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
                className={`${getStatusConfig(quote.status).color} flex items-center gap-1 px-3 py-1`}
              >
                {React.createElement(getStatusConfig(quote.status).icon, { className: "w-4 h-4" })}
                {getStatusConfig(quote.status).label}
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full sm:w-auto">
                              <Plus className="w-4 h-4 mr-2" />
                              <span className="text-sm">Agregar partida</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Seleccionar Cotizador</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {[
                                { id: 'vidrio', name: 'Vidrio' },
                                { id: 'ceramica', name: 'Cerámica' },
                                // { id: 'alhu', name: 'Alhú' }, // Desactivado temporalmente
                                { id: 'europa-basica', name: 'Europa Básica' },
                                { id: 'europa-sincro', name: 'Europa Sincro' },
                                { id: 'alto-brillo', name: 'Alto brillo' },
                                { id: 'super-mate', name: 'Super mate' },
                                { id: 'foil', name: 'Foil' },
                                { id: 'ventana', name: 'Ventana' },
                                { id: 'vista', name: 'Vista' },
                                { id: 'hoja-enchape', name: 'Hoja Enchape' },
                                { id: 'tapetes-foil', name: 'Tapetes de foil' },
                              ].map((configurator) => (
                                <Button
                                  key={configurator.id}
                                  variant="outline"
                                  className="h-20 text-sm"
                                  onClick={() => {
                                    if (configurator.id === 'vidrio') {
                                      setShowVidrioWizard(true)
                                    } else if (configurator.id === 'ceramica') {
                                      setShowCeramicaWizard(true)
                                    } // else if (configurator.id === 'alhu') {
                                    //   setAlhuWizardInitialData(undefined)
                                    //   setShowAlhuWizard(true)
                                    // }
                                    else if (configurator.id === 'europa-basica') {
                                      setEuropaBasicaWizardInitialData(undefined)
                                      setShowEuropaBasicaWizard(true)
                                    } else if (configurator.id === 'europa-sincro') {
                                      setEuropaSincroWizardInitialData(undefined)
                                      setShowEuropaSincroWizard(true)
                                    } else if (configurator.id === 'alto-brillo') {
                                      setAltoBrilloWizardInitialData(undefined)
                                      setShowAltoBrilloWizard(true)
                                    } else if (configurator.id === 'super-mate') {
                                      setSuperMateWizardInitialData(undefined)
                                      setShowSuperMateWizard(true)
                                    } else {
                                      console.log('Configurator not implemented:', configurator.id)
                                    }
                                  }}
                                >
                                  {configurator.name}
                                </Button>
                              ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {quote.items.map((item) => {
                    return (
                      <div key={item.id} className="mb-8 border rounded-lg shadow-sm">
                        <div className="bg-muted/30 px-4 py-2 border-b font-semibold flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span>Producto: {item.product.name}</span>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                              {(item.product as any)?.tiempoEntrega || 7} días de entrega
                            </span>
                          </div>
                          {isEditing && (
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEditItem(item)}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => setItemToDelete(item.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          )}
                        </div>
                        {renderItemTable(item)}
                      </div>
                    )
                  })}
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
                    <span className="text-muted-foreground">Suma de Subtotales:</span>
                    <span className="font-medium">{formatMXN(calculatedSummary.baseProductSubtotal)}</span>
                  </div>
                  
                  {calculatedSummary.expressDeliveryFees > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span className="text-muted-foreground font-medium">Envío Express:</span>
                      <span className="font-medium">+{formatMXN(calculatedSummary.expressDeliveryFees)}</span>
                    </div>
                  )}

                  {calculatedSummary.exhibitionFees > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="text-muted-foreground font-medium">Descuento Exhibición:</span>
                      <span className="font-medium">-{formatMXN(calculatedSummary.exhibitionFees)}</span>
                    </div>
                  )}

                  {calculatedSummary.discountAmount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span className="text-muted-foreground font-medium">Descuento Adicional:</span>
                      <span className="font-medium">-{formatMXN(calculatedSummary.discountAmount)}</span>
                    </div>
                  )}

                  <Separator />

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
            </motion.div>

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

        {/* Vidrio Wizard Dialog */}
        <Dialog open={showVidrioWizard} onOpenChange={setShowVidrioWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Vidrio</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <VidrioWizard
                key={editingItem?.id || `vidrio-${Date.now()}`}
                quoteId={params.id}
                initialData={vidrioWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Vidrio wizard complete:', data)
                  try {
                    const payload = {
                      lineId: 'cmm84mnhv0000le11rk32wdq1',
                      productId: data.productId,
                      quantity: data.quantity,
                      width: data.width,
                      height: data.height,
                      unitPrice: data.unitPrice,
                      totalPrice: data.totalPrice,
                      packagingCost: data.handlePrice,
                      isExpressDelivery: data.expressShipping,
                      isExhibition: data.demoProduct,
                      expressAmount: data.expressAmount || 0,
                      exhibitionAmount: data.exhibitionAmount || 0,
                      // Asegurar consistencia con las opciones
                      expressShipping: data.expressShipping,
                      demoProduct: data.demoProduct
                    }

                    const url = editingItem 
                      ? `/api/quotes/${params.id}/items/${editingItem.id}` 
                      : `/api/quotes/${params.id}/items/configured`
                    
                    const response = await fetch(url, {
                      method: editingItem ? 'PUT' : 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })

                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote() // Refresca la tabla
                      setEditingItem(null)
                      setVidrioWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (err) {
                    console.error('Error procesando vidrio:', err)
                    toast({
                      title: 'Error',
                      description: 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowVidrioWizard(false)
                }}
                onCancel={() => {
                  setShowVidrioWizard(false)
                  setEditingItem(null)
                  setVidrioWizardInitialData(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Ceramica Wizard Dialog */}
        <Dialog open={showCeramicaWizard} onOpenChange={setShowCeramicaWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Cerámica</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <CeramicaWizard
                key={editingItem?.id || `ceramica-${Date.now()}`}
                quoteId={params.id}
                initialData={ceramicaWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Ceramica wizard complete:', data)
                  try {
                    const payload = {
                      lineId: data.lineId,
                      productId: data.productId,
                      quantity: data.quantity,
                      customWidth: data.customWidth || data.width,
                      customHeight: data.customHeight || data.height,
                      unitPrice: data.unitPrice,
                      totalPrice: data.totalPrice,
                      handleModelId: data.handleModelId,
                      edgeBanding: data.edgeBanding,
                      ceramicColor: data.ceramicColor,
                      vetaOrientation: data.vetaOrientation,
                      packagingCost: data.handlePrice,
                      isExpressDelivery: data.isExpressDelivery,
                      isExhibition: data.isExhibition,
                      expressAmount: data.expressAmount || 0,
                      exhibitionAmount: data.exhibitionAmount || 0,
                      jaladera: data.jaladera,
                      jaladeraOrientation: data.jaladeraOrientation,
                      cubrecanto: data.cubrecanto,
                      handlePrice: data.handlePrice,
                    }

                    const url = editingItem 
                      ? `/api/quotes/${params.id}/items/${editingItem.id}` 
                      : `/api/quotes/${params.id}/items/configured`
                    
                    const response = await fetch(url, {
                      method: editingItem ? 'PUT' : 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload),
                    })

                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote()
                      setEditingItem(null)
                      setCeramicaWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error || 'Error desconocido')
                    }
                  } catch (err: any) {
                    console.error('Error procesando ceramica:', err)
                    toast({
                      title: 'Error',
                      description: err.message || 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowCeramicaWizard(false)
                }}
                onCancel={() => {
                  setShowCeramicaWizard(false)
                  setEditingItem(null)
                  setCeramicaWizardInitialData(undefined)
                }}
              />
            </div>
</DialogContent>
        </Dialog>

        {/* Alto Brillo Wizard Dialog */}
        <Dialog open={showAltoBrilloWizard} onOpenChange={setShowAltoBrilloWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Alto Brillo</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <AltoBrilloWizard
                quoteId={params.id}
                initialData={altoBrilloWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Alto Brillo wizard complete:', data)
                  try {
                    let response
                    if (editingItem) {
                      response = await fetch(`/api/quotes/${params.id}/items/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          quantity: data.quantity,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          customWidth: data.width,
                          customHeight: data.height,
                          isTwoSided: data.isTwoSided,
                          ceramicColor: data.tone || '',
                          edgeBanding: data.edgeBanding,
                          jaladera: data.handle,
                          jaladeraOrientation: data.handleOrientation,
                          handlePrice: data.handlePrice,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                          expressShipping: data.expressShipping,
                          demoProduct: data.demoProduct
                        }),
                      })
                    } else {
                      response = await fetch(`/api/quotes/${params.id}/items/configured`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lineId: 'cmm84o1r80004le11x2p8qhbw',
                          productId: data.productId, // Añadir productId
                          toneId: data.toneId,
                          ceramicColor: data.tone || data.ceramicColor || '',
                          quantity: data.quantity,
                          width: data.width,
                          height: data.height,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          handleModelId: '',
                          edgeBanding: data.edgeBanding,
                          isTwoSided: data.isTwoSided,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          pricePerSquareMeter: data.pricePerSquareMeter,
                          packagingCost: data.handlePrice,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                          jaladera: data.handle,
                          jaladeraOrientation: data.handleOrientation,
                        }),
                      })
                    }
                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote()
                      setEditingItem(null)
                      setAltoBrilloWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (err) {
                    console.error('Error adding/updating alto brillo product:', err)
                    toast({
                      title: 'Error',
                      description: 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowAltoBrilloWizard(false)
                }}
                onCancel={() => {
                  setShowAltoBrilloWizard(false)
                  setEditingItem(null)
                  setAltoBrilloWizardInitialData(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Super Mate Wizard Dialog */}
        <Dialog open={showSuperMateWizard} onOpenChange={setShowSuperMateWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Super Mate</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <SuperMateWizard
                quoteId={params.id}
                initialData={superMateWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Super Mate wizard complete:', data)
                  try {
                    let response
                    if (editingItem) {
                      response = await fetch(`/api/quotes/${params.id}/items/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          quantity: data.quantity,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          customWidth: data.width,
                          customHeight: data.height,
                          isTwoSided: data.isTwoSided,
                          ceramicColor: data.tone || '',
                          edgeBanding: data.edgeBanding,
                          jaladera: data.handle,
                          jaladeraOrientation: data.handleOrientation,
                          handlePrice: data.handlePrice,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                          expressShipping: data.expressShipping,
                          demoProduct: data.demoProduct
                        }),
                      })
                    } else {
                      response = await fetch(`/api/quotes/${params.id}/items/configured`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lineId: 'cmm84ogp30005le11zrjxio1p',
                          productId: data.productId,
                          toneId: data.toneId,
                          ceramicColor: data.tone || data.ceramicColor || '',
                          quantity: data.quantity,
                          width: data.width,
                          height: data.height,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          handleModelId: '',
                          edgeBanding: data.edgeBanding,
                          isTwoSided: data.isTwoSided,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          pricePerSquareMeter: data.pricePerSquareMeter,
                          packagingCost: data.handlePrice,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                          jaladera: data.handle,
                          jaladeraOrientation: data.handleOrientation,
                        }),
                      })
                    }
                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote()
                      setEditingItem(null)
                      setSuperMateWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (err) {
                    console.error('Error adding/updating super mate product:', err)
                    toast({
                      title: 'Error',
                      description: 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowSuperMateWizard(false)
                }}
                onCancel={() => {
                  setShowSuperMateWizard(false)
                  setEditingItem(null)
                  setSuperMateWizardInitialData(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Alhú Wizard Dialog */}
        <Dialog open={showAlhuWizard} onOpenChange={setShowAlhuWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Alhú</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <AlhuWizard
                quoteId={params.id}
                initialData={alhuWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Alhú wizard complete:', data)
                  try {
                    let response
                    if (editingItem) {
                      response = await fetch(`/api/quotes/${params.id}/items/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          quantity: data.quantity,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          customWidth: data.width,
                          customHeight: data.height,
                          handleModelId: data.handleModelId,
                          edgeBanding: data.tonoAluminio,
                          ceramicColor: data.tonoVidrio,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                        }),
                      })
                    } else {
                      response = await fetch(`/api/quotes/${params.id}/items/configured`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lineId: 'cmm84n8050002le11gtoiaf93',
                          productId: data.productId,
                          quantity: data.quantity,
                          width: data.width,
                          height: data.height,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          handleModelId: '',
                          edgeBanding: data.tonoAluminio,
                          ceramicColor: data.tonoVidrio,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                        }),
                      })
                    }
                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote()
                      setEditingItem(null)
                      setAlhuWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (err) {
                    console.error('Error adding/updating Alhú product:', err)
                    toast({
                      title: 'Error',
                      description: 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowAlhuWizard(false)
                }}
                onCancel={() => {
                  setShowAlhuWizard(false)
                  setEditingItem(null)
                  setAlhuWizardInitialData(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Europa Básica Wizard Dialog */}
        <Dialog open={showEuropaBasicaWizard} onOpenChange={setShowEuropaBasicaWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Europa Básica</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <EuropaBasicaWizard
                quoteId={params.id}
                initialData={europaBasicaWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Europa Básica wizard complete:', data)
                  try {
                    let response
                    if (editingItem) {
                      response = await fetch(`/api/quotes/${params.id}/items/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          quantity: data.quantity,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          customWidth: data.width,
                          customHeight: data.height,
                          handleModelId: data.handleModelId,
                          edgeBanding: data.edgeBanding,
                          ceramicColor: data.ceramicColor,
                          vetaOrientation: data.vetaOrientation,
                          jaladera: data.handle,
                          jaladeraOrientation: data.handleOrientation,
                          handlePrice: data.handlePrice,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                        }),
                      })
                    } else {
                      response = await fetch(`/api/quotes/${params.id}/items/configured`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lineId: 'cmm79y3oz0004le1105bhlipk',
                          productId: data.productId,
                          quantity: data.quantity,
                          width: data.width,
                          height: data.height,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          handleModelId: data.handleModelId,
                          edgeBanding: data.edgeBanding,
                          ceramicColor: data.ceramicColor,
                          vetaOrientation: data.vetaOrientation,
                          jaladera: data.handle,
                          jaladeraOrientation: data.handleOrientation,
                          handlePrice: data.handlePrice,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                        }),
                      })
                    }
                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote()
                      setEditingItem(null)
                      setEuropaBasicaWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (err) {
                    console.error('Error adding/updating Europa Básica product:', err)
                    toast({
                      title: 'Error',
                      description: 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowEuropaBasicaWizard(false)
                }}
                onCancel={() => {
                  setShowEuropaBasicaWizard(false)
                  setEditingItem(null)
                  setEuropaBasicaWizardInitialData(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Europa Sincro Wizard Dialog */}
        <Dialog open={showEuropaSincroWizard} onOpenChange={setShowEuropaSincroWizard}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Cotizador Europa Sincro</DialogTitle>
            </DialogHeader>
            <div className="flex-1">
              <EuropaSincroWizard
                quoteId={params.id}
                initialData={europaSincroWizardInitialData}
                expressDeliveryPercentage={companySettings?.expressDeliveryPercentage}
                exhibitionPercentage={companySettings?.exhibitionPercentage}
                onComplete={async (data) => {
                  console.log('Europa Sincro wizard complete:', data)
                  try {
                    let response
                    if (editingItem) {
                      response = await fetch(`/api/quotes/${params.id}/items/${editingItem.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          quantity: data.quantity,
                          unitPrice: data.unitPrice,
                          totalPrice: data.totalPrice,
                          customWidth: data.width,
                          customHeight: data.height,
                          handleModelId: data.handleModelId,
                          edgeBanding: data.edgeBanding,
                          ceramicColor: data.ceramicColor,
                          tonoColor: data.tonoColor,
                          packagingCost: data.handlePrice,
                          isExpressDelivery: data.expressShipping,
                          isExhibition: data.demoProduct,
                          expressAmount: data.expressAmount || 0,
                          exhibitionAmount: data.exhibitionAmount || 0,
                        }),
                      })
                    } else {
                      response = await fetch(`/api/quotes/${params.id}/items/configured`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        lineId: 'cmm84mnhv0000le11rk32wdq1',
                        productId: data.productId,
                        quantity: data.quantity,
                        width: data.width,
                        height: data.height,
                        unitPrice: data.unitPrice,
                        totalPrice: data.totalPrice,
                        packagingCost: data.handlePrice,
                        isExpressDelivery: data.expressShipping,
                        isExhibition: data.demoProduct,
                        expressAmount: data.expressAmount || 0,
                        exhibitionAmount: data.exhibitionAmount || 0,
                        // Añadimos estas nuevas opciones que faltaban
                        expressShipping: data.expressShipping,
                        demoProduct: data.demoProduct
                      }),

                      })
                    }
                    const result = await response.json()
                    if (result.success) {
                      await fetchQuote()
                      setEditingItem(null)
                      setEuropaSincroWizardInitialData(undefined)
                      toast({
                        title: editingItem ? 'Producto actualizado' : 'Producto agregado',
                        description: editingItem ? 'La partida ha sido actualizada' : 'El producto ha sido agregado a la cotización',
                      })
                    } else {
                      throw new Error(result.error)
                    }
                  } catch (err) {
                    console.error('Error adding/updating Europa Sincro product:', err)
                    toast({
                      title: 'Error',
                      description: 'Error al procesar el producto',
                      variant: 'destructive',
                    })
                  }
                  setShowEuropaSincroWizard(false)
                }}
                onCancel={() => {
                  setShowEuropaSincroWizard(false)
                  setEditingItem(null)
                  setEuropaSincroWizardInitialData(undefined)
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
