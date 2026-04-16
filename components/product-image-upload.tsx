
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { toast } from 'sonner';

interface ProductImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export default function ProductImageUpload({
  images,
  onImagesChange,
  maxImages = 10
}: ProductImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      toast.error(`Máximo ${maxImages} imágenes permitidas`);
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload/product-images', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir imágenes');
      }

      if (result.uploadedFiles && result.uploadedFiles.length > 0) {
        const newImages = [...images, ...result.uploadedFiles];
        onImagesChange(newImages);
        toast.success(result.message);
      }

      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error: string) => {
          toast.error(error);
        });
      }

    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Error al subir las imágenes');
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.svg']
    },
    multiple: true,
    disabled: uploading || images.length >= maxImages
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <Card>
          <CardContent className="p-6">
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-gray-500 bg-gray-50' : 'border-gray-300 hover:border-gray-400'}
                ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-module-black">Suelta las imágenes aquí...</p>
              ) : (
                <div>
                  <p className="text-gray-600 mb-2">
                    {uploading ? 'Subiendo...' : 'Arrastra imágenes aquí o haz clic para seleccionar'}
                  </p>
                  <p className="text-sm text-gray-500">
                    JPG, PNG, WebP o SVG. Máximo 10MB por imagen.
                  </p>
                  <p className="text-sm text-gray-500">
                    {images.length}/{maxImages} imágenes
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={image}
                    alt={`Producto ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  
                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-module-black text-white px-2 py-1 rounded text-xs font-medium">
                      Principal
                    </div>
                  )}

                  {/* Controls */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      {index > 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => moveImage(index, index - 1)}
                          className="text-xs"
                        >
                          ←
                        </Button>
                      )}
                      {index < images.length - 1 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => moveImage(index, index + 1)}
                          className="text-xs"
                        >
                          →
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeImage(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No hay imágenes del producto</p>
            <p className="text-sm text-gray-500 mt-2">
              Las imágenes ayudan a los clientes a visualizar mejor el producto
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
