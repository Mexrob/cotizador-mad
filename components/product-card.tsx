
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMXN } from '@/lib/utils'
import { ShoppingCart, Eye, Heart, LogIn } from 'lucide-react'
import { Product, ProductPricing } from '@/lib/types'

interface ProductCardProps {
  product: Product & { pricing?: ProductPricing[] }
  onAddToQuote?: (product: Product) => void
  onQuickView?: (product: Product) => void
}

export function ProductCard({ product, onAddToQuote, onQuickView }: ProductCardProps) {
  const { data: session, status } = useSession()
  const pricing = product.pricing?.[0]
  const price = pricing?.finalPrice || 0
  const thumbnail = product.thumbnail || product.images?.[0] || "https://i.pinimg.com/originals/dc/d4/20/dcd420da51472991c7727b49c399d123.jpg"
  
  const isAuthenticated = !!session

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -8 }}
      className="group"
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white"
              onClick={() => onQuickView?.(product)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white"
              onClick={() => onAddToQuote?.(product)}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full bg-white/90 hover:bg-white"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Status badge */}
          {product.status === 'DISCONTINUED' && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Descontinuado
            </Badge>
          )}
          
          {product.isCustomizable && (
            <Badge variant="success" className="absolute top-2 right-2">
              Personalizable
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 text-gray-900">
              {product.name}
            </h3>
            
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">SKU: {product.sku}</span>
              {product.leadTime && (
                <span className="text-xs text-blue-600">
                  Entrega: {product.leadTime} días
                </span>
              )}
            </div>
            
            {product.width && product.height && (
              <div className="text-xs text-gray-500">
                Dimensiones: {product.width} × {product.height} mm
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className={`p-4 pt-0 ${isAuthenticated ? 'flex items-center justify-between' : 'flex justify-end'}`}>
          {isAuthenticated && (
            <div className="space-y-1">
              <div className="text-2xl font-bold text-primary">
                {formatMXN(price)}
              </div>
              {pricing?.markup && pricing.markup > 0 && (
                <div className="text-xs text-gray-500">
                  Descuento aplicado
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-2">
            <Link href={`/products/${product.id}`}>
              <Button variant="outline" size="sm">
                Ver Detalles
              </Button>
            </Link>
            {isAuthenticated ? (
              <Button 
                size="sm"
                onClick={() => onAddToQuote?.(product)}
                className="bg-primary hover:bg-primary/90"
              >
                Cotizar
              </Button>
            ) : (
              <Link href="/auth/signin">
                <Button 
                  size="sm"
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
