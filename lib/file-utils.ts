/**
 * File utilities for handling file uploads
 */

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const ALLOWED_DOCUMENT_TYPES = ['application/pdf']
const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export interface FileValidationResult {
    valid: boolean
    error?: string
}

/**
 * Validate file type
 */
export function validateFileType(file: File): FileValidationResult {
    if (!ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP) y PDFs.'
        }
    }
    return { valid: true }
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024)
        return {
            valid: false,
            error: `El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`
        }
    }
    return { valid: true }
}

/**
 * Validate file (type and size)
 */
export function validateFile(file: File): FileValidationResult {
    const typeValidation = validateFileType(file)
    if (!typeValidation.valid) return typeValidation

    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) return sizeValidation

    return { valid: true }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

/**
 * Generate unique filename
 */
export function generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now()
    const extension = getFileExtension(originalName)
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName
    const sanitizedName = nameWithoutExt
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 50)

    return `${timestamp}-${sanitizedName}.${extension}`
}

/**
 * Check if file is an image
 */
export function isImage(filename: string): boolean {
    const ext = getFileExtension(filename)
    return ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
}

/**
 * Check if file is a PDF
 */
export function isPDF(filename: string): boolean {
    return getFileExtension(filename) === 'pdf'
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get file icon based on type
 */
export function getFileIcon(filename: string): string {
    if (isImage(filename)) return '🖼️'
    if (isPDF(filename)) return '📄'
    return '📎'
}
