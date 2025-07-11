
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatMXN(amount: number): string {
  return formatNumber(amount, 'MXN')
}

// Format number or currency for display
export function formatNumber(amount: number, currency?: string): string {
  const options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
  if (currency) {
    options.style = 'currency'
    options.currency = currency
  }
  return new Intl.NumberFormat('es-MX', options).format(amount)
}

// Format date for Mexico timezone
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Mexico_City',
  }).format(dateObj)
}

// Format date with time
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  }).format(dateObj)
}

/**
 * Generates a unique quote number in the format COT-YYYYMMDD-XXX.
 * @returns A unique quote number string.
 */
export function generateQuoteNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `COT-${year}${month}${day}-${random}`
}

/**
 * Generates a Stock Keeping Unit (SKU) based on category code and product name.
 * The SKU is formatted as CATEGORYCODE-PRODUCTNAME_PREFIX-RANDOM_NUMBER.
 * @param categoryCode The code for the product category.
 * @param productName The name of the product.
 * @returns A generated SKU string.
 */
export function generateSKU(categoryCode: string, productName: string): string {
  const cleanName = productName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 4)
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0')
  return `${categoryCode}-${cleanName}-${random}`
}

// Calculate tax amount
export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100)
}

// Calculate discount amount
export function calculateDiscount(amount: number, discountRate: number): number {
  return amount * (discountRate / 100)
}

/**
 * Calculates the total amount including discounts and taxes.
 * @param subtotal The subtotal amount before discounts and taxes.
 * @param taxRate The tax rate to apply (default is 16% for IVA in Mexico).
 * @param discountRate The discount rate to apply (default is 0%).
 * @returns An object containing the subtotal, discount amount, taxable amount, tax amount, and total.
 */
export function calculateTotal(
  subtotal: number,
  taxRate: number = 16, // IVA in Mexico
  discountRate: number = 0
): {
  subtotal: number
  discountAmount: number
  taxableAmount: number
  taxAmount: number
  total: number
} {
  const discountAmount = calculateDiscount(subtotal, discountRate)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = calculateTax(taxableAmount, taxRate)
  const total = taxableAmount + taxAmount

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxAmount,
    total,
  }
}

/**
 * Validates a Mexican RFC (Registro Federal de Contribuyentes) format.
 * @param rfc The RFC string to validate.
 * @returns True if the RFC is valid, false otherwise.
 */
export function validateRFC(rfc: string): boolean {
  const rfcPattern = /^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/
  return rfcPattern.test(rfc.toUpperCase())
}

/**
 * Formats an RFC string by converting it to uppercase and removing invalid characters.
 * @param rfc The RFC string to format.
 * @returns The formatted RFC string.
 */
export function formatRFC(rfc: string): string {
  return rfc.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '')
}

/**
 * Validates a Mexican phone number format.
 * Supports formats with or without country code (+52) and with optional spaces or hyphens.
 * @param phone The phone number string to validate.
 * @returns True if the phone number is valid, false otherwise.
 */
export function validateMexicanPhone(phone: string): boolean {
  const phonePattern = /^(\+52)?[\s-]?(\d{2})[\s-]?(\d{4})[\s-]?(\d{4})$/
  return phonePattern.test(phone)
}

/**
 * Formats a Mexican phone number into a consistent format (e.g., +52 XX XXXX XXXX).
 * @param phone The phone number string to format.
 * @returns The formatted phone number string.
 */
export function formatMexicanPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`
  }
  if (cleaned.length === 12 && cleaned.startsWith('52')) {
    return `+52 ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`
  }
  return phone
}

/**
 * Returns a user-friendly display name for a given role.
 * @param role The role string (e.g., 'ADMIN', 'DEALER').
 * @returns The display name for the role, or the original role if not found.
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    DEALER: 'Distribuidor',
    RETAIL: 'Cliente Minorista',
    VIP: 'Cliente VIP',
    WHOLESALE: 'Cliente Mayorista',
  }
  return roleNames[role] || role
}

/**
 * Returns a user-friendly display name for a given status.
 * @param status The status string (e.g., 'ACTIVE', 'INACTIVE').
 * @returns The display name for the status, or the original status if not found.
 */
export function getStatusDisplayName(status: string): string {
  const statusNames: Record<string, string> = {
    ACTIVE: 'Activo',
    INACTIVE: 'Inactivo',
    PENDING: 'Pendiente',
    DRAFT: 'Borrador',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    EXPIRED: 'Expirada',
    CONVERTED: 'Convertida',
    NEW: 'Nuevo',
    IN_PROGRESS: 'En Progreso',
    RESOLVED: 'Resuelto',
    CLOSED: 'Cerrado',
    DISCONTINUED: 'Descontinuado',
  }
  return statusNames[status] || status
}

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns The debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Formats a file size in bytes to a human-readable string (e.g., KB, MB, GB).
 * @param bytes The file size in bytes.
 * @returns A human-readable file size string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Creates a deep clone of an object using JSON.parse and JSON.stringify.
 * Note: This method does not support functions, Dates, or other complex types.
 * @param obj The object to clone.
 * @returns A deep clone of the object.
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Generates a random color from a predefined list of hex color codes.
 * @returns A random hex color string.
 */
export function generateRandomColor(): string {
  const colors = [
    '#60B5FF', '#FF9149', '#FF9898', '#FF90BB',
    '#FF6363', '#80D8C3', '#A19AD3', '#72BF78',
    '#FFD93D', '#6BCF7F', '#4D96FF', '#9B59B6'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

/**
 * Converts a dimension value from one unit to another.
 * Supported units: 'mm', 'cm', 'm', 'in', 'ft'.
 * @param value The dimension value to convert.
 * @param fromUnit The unit of the input value.
 * @param toUnit The target unit for the output value.
 * @returns The converted dimension value.
 */
export function convertDimensions(
  value: number,
  fromUnit: 'mm' | 'cm' | 'm' | 'in' | 'ft',
  toUnit: 'mm' | 'cm' | 'm' | 'in' | 'ft'
): number {
  // Convert to mm first
  let mmValue: number
  switch (fromUnit) {
    case 'mm': mmValue = value; break
    case 'cm': mmValue = value * 10; break
    case 'm': mmValue = value * 1000; break
    case 'in': mmValue = value * 25.4; break
    case 'ft': mmValue = value * 304.8; break
    default: mmValue = value
  }

  // Convert from mm to target unit
  switch (toUnit) {
    case 'mm': return mmValue
    case 'cm': return mmValue / 10
    case 'm': return mmValue / 1000
    case 'in': return mmValue / 25.4
    case 'ft': return mmValue / 304.8
    default: return mmValue
  }
}

/**
 * Generates a URL-friendly slug from a given text.
 * Converts text to lowercase, removes accents, and replaces spaces with hyphens.
 * @param text The input text.
 * @returns The generated slug string.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Safely parses a JSON string, returning a fallback value if parsing fails.
 * @param str The JSON string to parse.
 * @param fallback The fallback value to return if parsing fails.
 * @returns The parsed JSON object or the fallback value.
 */
export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

/**
 * Checks if a user has the required permissions based on their role and a hierarchy.
 * @param userRole The role of the user.
 * @param requiredRole An array of roles that grant permission.
 * @returns True if the user has permission, false otherwise.
 */
export function hasPermission(userRole: string, requiredRole: string[]): boolean {
  const roleHierarchy = {
    ADMIN: 5,
    DEALER: 4,
    VIP: 3,
    WHOLESALE: 2,
    RETAIL: 1,
  }
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0
  const requiredLevels = requiredRole.map(role =>
    roleHierarchy[role as keyof typeof roleHierarchy] || 0
  )
  
  return requiredLevels.some(level => userLevel >= level)
}

/**
 * Calculates the price of an item based on its dimensions and a base price per square millimeter.
 * @param width The width of the item in millimeters.
 * @param height The height of the item in millimeters.
 * @param basePricePerMm2 The base price per square millimeter.
 * @returns An object containing the calculated area, price, and their formatted string representations.
 */
export function calculateDimensionPrice(
  width: number,
  height: number,
  basePricePerMm2: number
): {
  area: number
  price: number
  formattedPrice: string
  formattedArea: string
} {
  // Validate inputs
  if (width <= 0 || height <= 0 || basePricePerMm2 < 0) {
    return {
      area: 0,
      price: 0,
      formattedPrice: formatNumber(0, 'MXN'),
      formattedArea: '0 mm²'
    }
  }

  // Calculate area in mm²
  const area = width * height
  
  // Calculate price
  const price = area * basePricePerMm2
  
  return {
    area,
    price,
    formattedPrice: formatNumber(price, 'MXN'),
    formattedArea: formatArea(area)
  }
}

/**
 * Formats an area in square millimeters to a human-readable string with appropriate units (mm², cm², or m²).
 * @param areaMm2 The area in square millimeters.
 * @returns A human-readable area string with units.
 */
export function formatArea(areaMm2: number): string {
  if (areaMm2 >= 1000000) {
    // Convert to m²
    const areaM2 = areaMm2 / 1000000
    return `${areaM2.toFixed(2)} m²`
  } else if (areaMm2 >= 10000) {
    // Convert to cm²
    const areaCm2 = areaMm2 / 100
    return `${areaCm2.toFixed(0)} cm²`
  } else {
    // Keep in mm²
    return `${areaMm2.toFixed(0)} mm²`
  }
}

// Validate dimension input
export function validateDimension(value: number, min: number = 1, max: number = 10000): boolean {
  return !isNaN(value) && value >= min && value <= max
}

// Convert dimensions to mm for calculation
export function convertToMM(value: number, unit: 'mm' | 'cm' | 'm'): number {
  switch (unit) {
    case 'mm': return value
    case 'cm': return value * 10
    case 'm': return value * 1000
    default: return value
  }
}
