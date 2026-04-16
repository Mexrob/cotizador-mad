
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { QuoteCard } from '@/components/quote-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMXN, getRoleDisplayName } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import {
  BarChart3,
  FileText,
  Package,
  TrendingUp,
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react'
import { DashboardStats, Quote } from '@/lib/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (quote: Quote) => {
    try {
      // Open the PDF in a new window/tab
      const pdfUrl = `/api/quotes/${quote.id}/pdf`
      window.open(pdfUrl, '_blank')
    } catch (error) {
      console.error('Error opening PDF:', error)
    }
  }

  const handleCreateQuote = async () => {
    try {
      setCreating(true)
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: session?.user?.name || 'Cliente Nuevo',
          customerEmail: session?.user?.email || 'cliente@example.com',
          projectName: 'Nueva Cotización',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Cotización creada exitosamente",
        })
        window.location.href = `/quotes/${result.data.id}`
      } else {
        toast({
          title: "Error",
          description: result.error || 'Error al crear cotización',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Create quote error:', error)
      toast({
        title: "Error",
        description: 'Error al crear cotización',
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-module-black mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2 truncate">
                Bienvenido, {session?.user?.name || 'Usuario'}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {getRoleDisplayName(session?.user?.role || 'RETAIL')}
                </Badge>
                <p className="text-muted-foreground">
                  Aquí tienes un resumen de tu actividad
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
                    Total Cotizaciones
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    {stats?.totalQuotes || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-module-black dark:text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
                    Pendientes
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">
                    {stats?.pendingQuotes || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
                    Aprobadas
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">
                    {stats?.approvedQuotes || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
                    Pagadas
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                    {stats?.paidQuotes || 0}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 truncate">
                    Valor Total
                  </p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 truncate">
                    {formatMXN(stats?.totalRevenue || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Recent Quotes */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  Cotizaciones Recientes
                </CardTitle>
                <Link href="/quotes" className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Eye className="w-4 h-4 mr-2" />
                    <span className="text-xs sm:text-sm">Ver Todas</span>
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {stats?.recentQuotes && stats.recentQuotes.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentQuotes.map((quote) => (
                      <QuoteCard
                        key={quote.id}
                        quote={quote}
                        onDownloadPDF={handleDownloadPDF}
                        onRefresh={fetchDashboardStats}
                        showUserInfo={session?.user?.role === 'ADMIN'}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      No hay cotizaciones
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Comienza creando tu primera cotización. Usa el botón "Nueva Cotización" en la barra lateral.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Quick Actions */}
            <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Acciones Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <Button
                  className="w-full justify-start bg-module-black hover:bg-module-dark text-white text-sm"
                  onClick={handleCreateQuote}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Nueva Cotización
                </Button>
                <Link href="/quotes" className="block">
                  <Button className="w-full justify-start text-sm" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Mis Cotizaciones
                  </Button>
                </Link>
                {session?.user?.role === 'ADMIN' && (
                  <>
                    <Link href="/admin" className="block">
                      <Button className="w-full justify-start text-sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Panel Admin
                      </Button>
                    </Link>
                    <Link href="/admin/products" className="block">
                      <Button className="w-full justify-start text-sm" variant="outline">
                        <Package className="w-4 h-4 mr-2" />
                        Gestión Productos
                      </Button>
                    </Link>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top Products (Admin only) */}
            {session?.user?.role === 'ADMIN' && stats?.topProducts && stats.topProducts.length > 0 && (
              <Card className="bg-card dark:bg-card backdrop-blur-sm border dark:border-border shadow-lg dark:shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">
                    Productos Más Vendidos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.topProducts.slice(0, 5).map((item, index) => (
                    <div key={item.product?.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-module-black">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {item.product?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} vendidos
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {formatMXN(item.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Monthly Summary */}
            <Card className="bg-gradient-to-br from-module-black to-module-dark text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Resumen del Mes</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-100">Cotizaciones:</span>
                    <span className="font-semibold">{stats?.monthlyQuotes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-100">Ingresos:</span>
                    <span className="font-semibold">{formatMXN(stats?.monthlyRevenue || 0)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
