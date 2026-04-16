'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import { validateFile, formatFileSize, isImage, isPDF } from '@/lib/file-utils'
import { toast } from 'sonner'
import Image from 'next/image'

interface FileUploadProps {
    quoteId: string
    existingFiles?: string[]
    onUploadComplete: (fileUrl: string) => void
    onDeleteFile: (fileUrl: string) => void
    disabled?: boolean
}

export default function FileUpload({
    quoteId,
    existingFiles = [],
    onUploadComplete,
    onDeleteFile,
    disabled = false
}: FileUploadProps) {
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (disabled) return

        const file = acceptedFiles[0]
        if (!file) return

        // Validate file
        const validation = validateFile(file)
        if (!validation.valid) {
            toast.error(validation.error)
            return
        }

        // Check limit
        if (existingFiles.length >= 10) {
            toast.error('Límite de archivos alcanzado (máximo 10)')
            return
        }

        try {
            setUploading(true)
            setUploadProgress(0)
            const formData = new FormData()
            formData.append('file', file)

            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90))
            }, 200)

            const response = await fetch(`/api/quotes/${quoteId}/attachments`, {
                method: 'POST',
                body: formData
            })

            clearInterval(progressInterval)
            setUploadProgress(100)

            const data = await response.json()

            if (data.success) {
                toast.success('Archivo subido correctamente')
                onUploadComplete(data.data.url)
            } else {
                toast.error(data.error || 'Error al subir el archivo')
            }
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Error al subir el archivo')
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }, [quoteId, existingFiles.length, onUploadComplete, disabled])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        disabled: disabled || uploading
    })

    const handleDelete = async (fileUrl: string) => {
        if (disabled) return

        try {
            const response = await fetch(`/api/quotes/${quoteId}/attachments`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileUrl })
            })

            const data = await response.json()

            if (data.success) {
                toast.success('Archivo eliminado correctamente')
                onDeleteFile(fileUrl)
            } else {
                toast.error(data.error || 'Error al eliminar el archivo')
            }
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Error al eliminar el archivo')
        }
    }

    return (
        <div className="space-y-4">
            {/* Upload Zone */}
            {!disabled && existingFiles.length < 10 && (
                <div
                    {...getRootProps()}
                    className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
                >
                    <input {...getInputProps()} />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    {uploading ? (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">Subiendo archivo...</p>
                            <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                            <p className="text-xs text-gray-500">{uploadProgress}%</p>
                        </div>
                    ) : isDragActive ? (
                        <p className="text-sm text-gray-600">Suelta el archivo aquí...</p>
                    ) : (
                        <div>
                            <p className="text-sm text-gray-600 mb-2">
                                Arrastra un archivo aquí o haz clic para seleccionar
                            </p>
                            <p className="text-xs text-gray-500">
                                Imágenes (JPG, PNG, WebP) o PDF - Máximo 5MB
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Existing Files */}
            {existingFiles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                        Archivos Adjuntos ({existingFiles.length}/10)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {existingFiles.map((fileUrl, index) => {
                            const filename = fileUrl.split('/').pop() || 'archivo'
                            const isImg = isImage(filename)
                            const isPdf = isPDF(filename)

                            return (
                                <Card key={index} className="p-3 relative group">
                                    {!disabled && (
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            onClick={() => handleDelete(fileUrl)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}

                                    {isImg ? (
                                        <div className="relative w-full h-32 mb-2 rounded overflow-hidden bg-gray-100">
                                            <Image
                                                src={fileUrl}
                                                alt={filename}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                    ) : isPdf ? (
                                        <div className="flex items-center justify-center h-32 mb-2 bg-red-50 rounded">
                                            <FileText className="w-16 h-16 text-red-600" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-32 mb-2 bg-gray-50 rounded">
                                            <FileText className="w-16 h-16 text-gray-400" />
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-600 truncate" title={filename}>
                                        {filename}
                                    </p>

                                    <div className="flex gap-2 mt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1 text-xs"
                                            onClick={() => window.open(fileUrl, '_blank')}
                                        >
                                            {isImg ? 'Ver' : 'Descargar'}
                                        </Button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            )}

            {existingFiles.length === 0 && disabled && (
                <p className="text-sm text-gray-500 text-center py-4">
                    No hay archivos adjuntos
                </p>
            )}
        </div>
    )
}
