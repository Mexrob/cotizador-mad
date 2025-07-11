
'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { Upload, X, Image as ImageIcon } from 'lucide-react'

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logoUrl: string | null) => void
  className?: string
}

export default function LogoUpload({ 
  currentLogo, 
  onLogoChange, 
  className = '' 
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos JPG, PNG y SVG.",
        variant: "destructive",
      })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo debe ser menor a 5MB.",
        variant: "destructive",
      })
      return
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)

    // Upload file
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', file)

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        onLogoChange(result.data.url)
        toast({
          title: "Logotipo subido",
          description: "El logotipo se ha subido exitosamente.",
        })
      } else {
        throw new Error(result.error || 'Error al subir archivo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el logotipo.",
        variant: "destructive",
      })
      // Reset preview on error
      setPreview(currentLogo || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveLogo = () => {
    setPreview(null)
    onLogoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast({
      title: "Logotipo eliminado",
      description: "El logotipo ha sido eliminado.",
    })
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-sm font-medium text-gray-700">
        Logotipo de la Empresa
      </Label>
      
      <div className="space-y-4">
        {/* Current Logo Display */}
        {preview ? (
          <div className="relative group">
            <div className="relative w-48 h-32 bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <Image
                src={preview}
                alt="Logotipo de la empresa"
                fill
                className="object-contain p-2"
                sizes="(max-width: 768px) 100vw, 192px"
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemoveLogo}
              disabled={uploading}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <div className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Sin logotipo</p>
            </div>
          </div>
        )}

        {/* Upload Controls */}
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={triggerFileInput}
            disabled={uploading}
            className="flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{preview ? 'Cambiar Logotipo' : 'Subir Logotipo'}</span>
          </Button>
          
          {preview && (
            <Button
              type="button"
              variant="ghost"
              onClick={handleRemoveLogo}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              Eliminar
            </Button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/svg+xml"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Help Text */}
        <p className="text-xs text-gray-500">
          Formatos soportados: JPG, PNG, SVG. Tamaño máximo: 5MB.
          Se recomienda un tamaño de 300x200 píxeles para mejores resultados.
        </p>

        {uploading && (
          <div className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Subiendo logotipo...</span>
          </div>
        )}
      </div>
    </div>
  )
}
