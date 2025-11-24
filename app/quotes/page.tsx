
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { QuoteCard } from '@/components/quote-card'
import { AdvancedFilters, AdvancedFilters as FilterType } from '@/components/advanced-filters'
import { BulkActions } from '@/components/bulk-actions'
import { QuoteSummaryStats } from '@/components/quote-summary-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  FileText,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Quote } from '@/lib/types'
import { toast } from 'sonner'

export default function QuotesPage() {
  const { data: session } = useSession()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [summary, setSummary] = useState({
    totalValue: 0,
    averageValue: 0,
    totalCount: 0,
  })
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [filters, setFilters] = useState<FilterType>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const fetchQuotes = useCallback(async (resetPage = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()

      // Pagination
      params.set('page', resetPage ? '1' : pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      // Filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            if (key === 'statuses') {
              params.set('statuses', value.join(','))
            }
          } else if (value instanceof Date) {
            params.set(key, value.toISOString().split('T')[0])
          } else {
            params.set(key, value.toString())
          }
        }
      })

      const response = await fetch(`/api/quotes?${params}`)
      const data = await response.json()

      if (data.success) {
        setQuotes(data.data)
        setPagination(data.pagination)
        setSummary(data.summary)
        setStatusCounts(data.statusCounts || {})

        // Reset selection when filters change
        setSelectedIds([])
      } else {
        toast.error('Error al cargar cotizaciones')
      }
    } catch (error) {
      console.error('Error fetching quotes:', error)
      toast.error('Error al cargar cotizaciones')
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  useEffect(() => {
    fetchQuotes(true)
  }, [filters])

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      const pdfUrl = `/api/quotes/${quote.id}/pdf`
      window.open(pdfUrl, '_blank')
      toast.success('PDF abierto en nueva pestaña')
    } catch (error) {
      console.error('Error opening PDF:', error)
      toast.error('Error al abrir PDF')
    }
  }

  const handleFiltersChange = (newFilters: FilterType) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  const handleSelectQuote = (quoteId: string, checked: boolean) => {
    setSelectedIds(prev =>
      checked
        ? [...prev, quoteId]
        : prev.filter(id => id !== quoteId)
    )
  }

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? quotes.map(q => q.id) : [])
  }

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      const response = await fetch('/api/quotes/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          quoteIds: selectedIds,
          ...data,
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (action === 'export') {
          // Handle export (you could download CSV, etc.)
          console.log('Export data:', result.data)
          toast.success('Datos exportados exitosamente')
        } else {
          await fetchQuotes()
          toast.success(result.message)
        }
      } else {
        toast.error(result.error || `Error en acción ${action}`)
      }
    } catch (error) {
      console.error('Bulk action error:', error)
      toast.error(`Error al ejecutar acción ${action}`)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-module-black to-module-dark text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <motion.h1
                className="text-4xl md:text-6xl font-bold mb-4"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                {session?.user?.role === 'ADMIN' ? 'Todas las Cotizaciones' : 'Mis Cotizaciones'}
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-gray-100"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {session?.user?.role === 'ADMIN'
                  ? 'Gestiona todas las cotizaciones del sistema'
                  : 'Gestiona y revisa todas tus cotizaciones'
                }
              </motion.p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 lg:mt-0 flex gap-3"
            >
              <Button
                variant="outline"
                size="lg"
                onClick={() => fetchQuotes()}
                disabled={loading}
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 mr-2" />
                )}
                Actualizar
              </Button>
              {/* Botón de Nueva Cotización eliminado */}
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Summary Statistics */}
        <QuoteSummaryStats summary={summary} isLoading={loading} />

        {/* Advanced Filters */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AdvancedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
            statusCounts={statusCounts}
          />
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-module-black" />
            <span className="ml-2 text-lg">Cargando cotizaciones...</span>
          </div>
        ) : quotes.length === 0 ? (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-md mx-auto bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
              <CardContent className="p-8">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-foreground mb-2">
                  No hay cotizaciones
                </h3>
                <p className="text-muted-foreground mb-6">
                  {Object.keys(filters).some(key => {
                    const value = filters[key as keyof FilterType]
                    return value !== undefined && value !== '' &&
                      !(Array.isArray(value) && value.length === 0) &&
                      !(key === 'sortBy' && value === 'createdAt') &&
                      !(key === 'sortOrder' && value === 'desc')
                  })
                    ? 'No se encontraron cotizaciones con los filtros aplicados'
                    : 'Comienza creando tu primera cotización'
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* Botón de Nueva Cotización eliminado */}
                  {Object.keys(filters).some(key => {
                    const value = filters[key as keyof FilterType]
                    return value !== undefined && value !== '' &&
                      !(Array.isArray(value) && value.length === 0) &&
                      !(key === 'sortBy' && value === 'createdAt') &&
                      !(key === 'sortOrder' && value === 'desc')
                  }) && (
                      <Button
                        variant="outline"
                        onClick={handleClearFilters}
                      >
                        Limpiar Filtros
                      </Button>
                    )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Selection Header */}
            {quotes.length > 0 && (
              <motion.div
                className="mb-6 p-4 bg-white rounded-lg shadow-sm border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedIds.length === quotes.length}
                      onCheckedChange={handleSelectAll}
                      className="h-5 w-5"
                    />
                    <span className="text-sm text-muted-foreground">
                      Seleccionar todas las cotizaciones en esta página
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {pagination.total} cotización{pagination.total !== 1 ? 'es' : ''} total{pagination.total !== 1 ? 'es' : ''}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Quotes Grid */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {quotes.map((quote, index) => (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                >
                  <Checkbox
                    checked={selectedIds.includes(quote.id)}
                    onCheckedChange={(checked) => handleSelectQuote(quote.id, !!checked)}
                    className="mt-6 h-5 w-5"
                  />
                  <div className="flex-1">
                    <QuoteCard
                      quote={quote}
                      onDownloadPDF={handleDownloadPDF}
                      onRefresh={fetchQuotes}
                      showUserInfo={session?.user?.role === 'ADMIN'}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                className="mt-8 flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Bulk Actions */}
      <BulkActions
        selectedIds={selectedIds}
        totalCount={quotes.length}
        onSelectAll={handleSelectAll}
        onClearSelection={() => setSelectedIds([])}
        onBulkAction={handleBulkAction}
        disabled={loading}
      />
    </div>
  )
}
