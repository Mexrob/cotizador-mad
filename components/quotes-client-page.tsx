'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { QuoteCard } from '@/components/quote-card'
import { AdvancedFilters, AdvancedFilters as FilterType } from '@/components/advanced-filters'
import { BulkActions } from '@/components/bulk-actions'
import { QuoteSummaryStats } from '@/components/quote-summary-stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, FileText, Loader2, RefreshCw } from 'lucide-react'
import { Quote } from '@/lib/types'
import { toast } from 'sonner'

export default function QuotesClientPage({ initialData, initialStats, initialStatusCounts }: any) {
  const { data: session } = useSession()
  const [quotes, setQuotes] = useState<Quote[]>(initialData || [])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: initialStats?.total || 0,
    totalPages: initialStats?.pages || 0,
  })
  const [summary, setSummary] = useState(initialStats?.summary || {
    totalValue: 0,
    averageValue: 0,
    totalCount: 0,
  })
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(initialStatusCounts || {})
  const [filters, setFilters] = useState<FilterType>({
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const fetchQuotes = useCallback(async (resetPage = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', resetPage ? '1' : pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value) && value.length > 0) {
            if (key === 'statuses') params.set('statuses', value.join(','))
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
      window.open(`/api/quotes/${quote.id}/pdf`, '_blank')
      toast.success('PDF abierto en nueva pestaña')
    } catch (error) {
      toast.error('Error al abrir PDF')
    }
  }

  const handleCreateQuote = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Cliente Nuevo',
          customerEmail: 'cliente@example.com',
          projectName: 'Nueva Cotización',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Cotización creada exitosamente')
        window.location.href = `/quotes/${result.data.id}`
      } else {
        toast.error(result.error || 'Error al crear cotización')
      }
    } catch (error) {
      toast.error('Error al crear cotización')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-r from-module-black to-module-dark text-white py-8 sm:py-12 lg:py-16">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex-1">
              <motion.h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4">
                {session?.user?.role === 'ADMIN' ? 'Todas las Cotizaciones' : 'Mis Cotizaciones'}
              </motion.h1>
            </div>
            <Button variant="secondary" size="lg" onClick={handleCreateQuote} disabled={creating} className="bg-white text-module-black hover:bg-gray-100">
              {creating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Plus className="w-5 h-5 mr-2" />}
              {creating ? 'Creando...' : 'Nueva Cotización'}
            </Button>
          </div>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <QuoteSummaryStats summary={summary} isLoading={loading} />
        <AdvancedFilters filters={filters} onFiltersChange={setFilters} onClearFilters={() => setFilters({ sortBy: 'createdAt', sortOrder: 'desc' })} statusCounts={statusCounts} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-module-black" />
          </div>
        ) : quotes.length === 0 ? (
          <Card className="max-w-md mx-auto p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No hay cotizaciones</h3>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <div key={quote.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
                <QuoteCard quote={quote} onDownloadPDF={handleDownloadPDF} onRefresh={fetchQuotes} showUserInfo={session?.user?.role === 'ADMIN'} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
