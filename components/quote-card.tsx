
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMXN, formatDate, getStatusDisplayName } from '@/lib/utils'
import { 
  Clock, 
  User, 
  MapPin,
  Package
} from 'lucide-react'
import { Quote } from '@/lib/types'
import { QuoteActions } from '@/components/quote-actions'

interface QuoteCardProps {
  quote: Quote & { 
    user?: { name?: string | null; email: string }
    _count?: { items: number }
  }
  onDownloadPDF?: (quote: Quote) => void
  onRefresh?: () => void
  showUserInfo?: boolean
}

export function QuoteCard({ quote, onDownloadPDF, onRefresh, showUserInfo = false }: QuoteCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'success'
      case 'REJECTED': return 'destructive'
      case 'EXPIRED': return 'destructive'
      case 'PENDING': return 'warning'
      case 'CONVERTED': return 'success'
      default: return 'secondary'
    }
  }

  const isExpired = new Date(quote.validUntil) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
    >
      <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold text-lg text-gray-900">
                {quote.quoteNumber}
              </h3>
              <p className="text-sm text-gray-600">
                {quote.projectName}
              </p>
            </div>
            <Badge variant={getStatusVariant(quote.status)}>
              {getStatusDisplayName(quote.status)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{quote.customerName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{quote.customerEmail}</span>
            </div>
            {quote.projectAddress && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="line-clamp-1">{quote.projectAddress}</span>
              </div>
            )}
          </div>

          {/* User Info (for admin) */}
          {showUserInfo && quote.user && (
            <div className="border-t pt-3">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Creado por:</span> {quote.user.name || quote.user.email}
              </div>
            </div>
          )}

          {/* Quote Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  {quote._count?.items || 0} productos
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Válida hasta: {formatDate(quote.validUntil)}
                </span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {formatMXN(quote.totalAmount)}
              </div>
              {quote.discountAmount > 0 && (
                <div className="text-xs text-green-600">
                  Descuento: {formatMXN(quote.discountAmount)}
                </div>
              )}
            </div>
          </div>

          {/* Warning for expired quotes */}
          {isExpired && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              ⚠️ Esta cotización ha expirado
            </div>
          )}

          {/* Creation date */}
          <div className="text-xs text-gray-500 border-t pt-2">
            Creada el {formatDate(quote.createdAt)}
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <QuoteActions
            quote={quote}
            onDownloadPDF={onDownloadPDF}
            onRefresh={onRefresh}
            showUserInfo={showUserInfo}
          />
        </CardFooter>
      </Card>
    </motion.div>
  )
}
