
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { formatMXN, getRoleDisplayName, calculateDimensionPrice } from '@/lib/utils'
import DimensionCalculator from '@/components/dimension-calculator'
import { 
  ArrowLeft, 
  ShoppingCart, 
  Heart, 
  Share2, 
  Ruler, 
  Weight, 
  Clock, 
  Package,
  Info,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { Product } from '@/lib/types'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchProduct()
    }
  }, [params.id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()
      
      if (data.success) {
        setProduct(data.data)
      } else {
        toast({
          title: 'Error',
          description: 'Producto no encontrado',
          variant: 'destructive',
        })
        router.push('/products')
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: 'Error',
        description: 'Error al cargar el producto',
        variant: 'destructive',
      })
      router.push('/products')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToQuote = () => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // TODO: Implement add to quote functionality
    toast({
      title: 'Producto agregado',
      description: `${product?.name} se agregó a tu cotización`,
    })
  }

  const handleAddCustomDimensionsToQuote = (data: {
    productId: string;
    customWidth: number;
    customHeight: number;
    calculatedPrice: number;
    area: number;
  }) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    
    // TODO: Implement add to quote with custom dimensions functionality
    console.log('Adding to quote with custom dimensions:', data)
    
    // For now, just show success message
    toast({
      title: 'Producto agregado con dimensiones personalizadas',
      description: `${product?.name} (${data.customWidth}×${data.customHeight}mm) - ${formatMXN(data.calculatedPrice)}`,
    })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || 'Producto',
          text: product?.description || 'Producto de cocina de lujo',
          url: window.location.href,
        })
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: 'Link copiado',
        description: 'El link del producto ha sido copiado al portapapeles',
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Cargando producto...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Producto no encontrado</h1>
          <p className="text-gray-600 mb-6">El producto que buscas no existe o ha sido eliminado</p>
          <Link href="/products">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Catálogo
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const pricing = product.pricing?.[0]
  const price = pricing?.finalPrice || 0
  const images = product.images?.length > 0 ? product.images : [product.thumbnail ?? "https://i.pinimg.com/originals/93/03/8f/93038f4c36d3c9102a22e7b57a8286e3.jpg"]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Catálogo
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Image */}
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-lg">
              <Image
                src={images[selectedImageIndex] || "https://s3.amazonaws.com/PhenomHome/Images/Luxury+Kitchens/shutterstock_166053755.jpg"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Status badges */}
              <div className="absolute top-4 left-4 space-y-2">
                {product.status === 'DISCONTINUED' && (
                  <Badge variant="destructive">
                    Descontinuado
                  </Badge>
                )}
                {product.isCustomizable && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Personalizable
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-square overflow-hidden rounded-lg ${
                      selectedImageIndex === index 
                        ? 'ring-2 ring-blue-500' 
                        : 'hover:opacity-80'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - vista ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">
                  {product.category?.name || 'Categoría'}
                </Badge>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="icon" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>
              
              {product.description && (
                <p className="text-lg text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}
            </div>

            {/* Price */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    {session ? (
                      <>
                        <div className="text-3xl font-bold text-primary mb-1">
                          {formatMXN(price)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Precio para {getRoleDisplayName(session.user.role)}
                        </div>
                        {pricing?.markup && pricing.markup > 0 && (
                          <div className="text-sm text-green-600">
                            Descuento aplicado
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-2xl font-bold text-gray-500 mb-1">
                          Precio confidencial
                        </div>
                        <Link href="/auth/signin">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-sm p-0 h-auto text-blue-600 hover:text-blue-800 hover:bg-transparent"
                          >
                            Inicia sesión para ver precios
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">SKU</div>
                    <div className="font-mono text-sm">{product.sku}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Especificaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(product.width || product.height) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">Dimensiones Estándar</span>
                    </div>
                    <span className="font-medium">
                      {product.width} × {product.height} mm
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Tiempo de entrega</span>
                  </div>
                  <span className="font-medium">{product.leadTime} días</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Personalizable</span>
                  </div>
                  <span className="font-medium">
                    {product.isCustomizable ? 'Sí' : 'No'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-700">Precio Base</span>
                  </div>
                  <span className="font-medium">
                    ${product.basePrice?.toFixed(6) || '0.000000'} MXN/mm²
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Dimension Calculator */}
            {product.isCustomizable && product.basePrice && (
              <DimensionCalculator
                basePrice={product.basePrice}
                productName={product.name}
                productId={product.id}
                currency={product.currency || 'MXN'}
                onAddToQuote={handleAddCustomDimensionsToQuote}
                className="bg-gradient-to-br from-blue-50 to-indigo-50"
              />
            )}

            {/* Materials */}
            {product.materials && product.materials.length > 0 && (
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Materiales Disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {product.materials.map((material) => (
                      <div key={material.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div 
                          className="w-8 h-8 rounded-full border"
                          style={{ backgroundColor: material.color || '#gray' }}
                        />
                        <div>
                          <div className="font-medium text-sm">{material.name}</div>
                          <div className="text-xs text-gray-500">{material.finish}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                onClick={handleAddToQuote}
                className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                disabled={product.status === 'DISCONTINUED'}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.status === 'DISCONTINUED' ? 'No Disponible' : 'Agregar a Cotización'}
              </Button>
              
              <Link href="/configurator" className="block">
                <Button variant="outline" className="w-full h-12 text-lg">
                  Ir al Configurador
                </Button>
              </Link>
            </div>


          </motion.div>
        </div>
      </div>
    </div>
  )
}
