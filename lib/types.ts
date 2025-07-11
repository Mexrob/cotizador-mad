
import { UserRole, UserStatus, QuoteStatus, ProductStatus } from '@prisma/client'
export { UserRole, UserStatus, QuoteStatus, ProductStatus }

export interface User {
  id: string
  name?: string | null
  email: string
  role: UserRole
  status: UserStatus
  companyName?: string | null
  taxId?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country: string
  discountRate: number
  creditLimit: number
  createdAt: Date
  updatedAt: Date
}

export interface Product {
  id: string
  name: string
  description?: string | null
  sku: string
  categoryId: string
  status: ProductStatus
  width?: number | null
  height?: number | null
  dimensionUnit: string
  basePrice: number
  currency: string
  images: string[]
  model3d?: string | null
  thumbnail?: string | null
  isCustomizable: boolean
  leadTime: number
  minQuantity: number
  maxQuantity?: number | null
  tags: string[]
  featured: boolean
  category?: Category
  materials?: Material[]
  hardware?: Hardware[]
  pricing?: ProductPricing[]
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  description?: string | null
  image?: string | null
  parentId?: string | null
  status: ProductStatus
  children?: Category[]
  products?: Product[]
  createdAt: Date
  updatedAt: Date
}

export interface Material {
  id: string
  name: string
  description?: string | null
  image?: string | null
  color?: string | null
  finish?: string | null
  texture?: string | null
  status: ProductStatus
  costPerUnit: number
  unit: string
  createdAt: Date
  updatedAt: Date
}

export interface Hardware {
  id: string
  name: string
  description?: string | null
  image?: string | null
  type: string
  brand?: string | null
  model?: string | null
  status: ProductStatus
  costPerUnit: number
  unit: string
  createdAt: Date
  updatedAt: Date
}

export interface ProductPricing {
  id: string
  productId: string
  userRole: UserRole
  basePrice: number
  markup: number
  finalPrice: number
  createdAt: Date
  updatedAt: Date
}

export interface Quote {
  id: string
  quoteNumber: string
  userId: string
  status: QuoteStatus
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  customerAddress?: string | null
  projectName: string
  projectAddress?: string | null
  roomDimensions?: any
  subtotal: number
  taxAmount: number
  discountAmount: number
  totalAmount: number
  validUntil: Date
  deliveryDate?: Date | null
  notes?: string | null
  attachments: string[]
  design3d?: any
  floorPlan?: string | null
  user?: User
  items?: QuoteItem[]
  createdAt: Date
  updatedAt: Date
}

export interface QuoteItem {
  id: string
  quoteId: string
  productId: string
  quantity: number
  customWidth?: number | null
  customHeight?: number | null
  customDepth?: number | null
  selectedMaterial?: string | null
  selectedHardware?: string | null
  customOptions?: any
  unitPrice: number
  totalPrice: number
  product?: Product
  createdAt: Date
  updatedAt: Date
}

export interface CompanySettings {
  id: string
  companyName: string
  logo?: string | null
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
  email: string
  website?: string | null
  taxId: string
  primaryColor: string
  secondaryColor: string
  tertiaryColor: string
  currency: string
  timezone: string
  language: string
  createdAt: Date
  updatedAt: Date
}

export interface TaxSettings {
  id: string
  name: string
  rate: number
  isDefault: boolean
  description?: string | null
  createdAt: Date
  updatedAt: Date
}



// Form types
export interface ProductFilters {
  categoryId?: string
  search?: string
  priceRange?: [number, number]
  materials?: string[]
  inStock?: boolean
  sortBy?: 'name' | 'price' | 'newest' | 'popularity'
  sortOrder?: 'asc' | 'desc'
}

export interface QuoteFilters {
  status?: QuoteStatus[]
  dateRange?: [Date, Date]
  customerName?: string
  projectName?: string
  amountRange?: [number, number]
}

// Configuration types
export interface ConfiguratorStep {
  id: string
  title: string
  description: string
  completed: boolean
  current: boolean
}

export interface RoomConfiguration {
  width: number
  height: number
  depth: number
  doors: DoorPosition[]
  windows: WindowPosition[]
  obstacles: Obstacle[]
}

export interface DoorPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
  swing: 'left' | 'right' | 'inward' | 'outward'
}

export interface WindowPosition {
  id: string
  x: number
  y: number
  width: number
  height: number
  sill: number
}

export interface Obstacle {
  id: string
  x: number
  y: number
  width: number
  height: number
  depth: number
  type: string
  description: string
}

// PDF Generation types
export interface PDFQuoteData {
  quote: Quote
  company: CompanySettings
  items: QuoteItem[]
  taxSettings: TaxSettings[]
}

// Dashboard types
export interface DashboardStats {
  totalQuotes: number
  pendingQuotes: number
  approvedQuotes: number
  monthlyQuotes: number
  totalRevenue: number
  monthlyRevenue: number
  topProducts: Array<{
    product: Product
    quantity: number
    revenue: number
  }>
  recentQuotes: Quote[]
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Mexico specific types
export interface MexicoTaxInfo {
  rfc: string
  businessName: string
  fiscalRegime: string
  address: string
  zipCode: string
}

export interface SATCompliantTransaction {
  id: string
  type: 'sale' | 'purchase' | 'expense'
  amount: number
  tax: number
  date: Date
  description: string
  relatedParty?: boolean
  transferPricingMethod?: 'CUPM' | 'RPM' | 'CPM' | 'TNMM' | 'PSM'
}
