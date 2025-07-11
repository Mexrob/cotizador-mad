
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { 
  Settings, 
  Users, 
  Package, 
  BarChart3, 
  Building, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
  Folder
} from 'lucide-react'
import UserManagement from './components/user-management'
import LogoUpload from '@/components/logo-upload'
import Link from 'next/link'

interface CompanySettings {
  companyName: string
  logo?: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  taxId: string
  website?: string
}

interface DashboardStats {
  totalUsers: number
  totalProducts: number
  totalQuotes: number
  activeQuotes: number
  recentUsers: any[]
  recentQuotes: any[]
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Cocinas de Lujo',
    logo: undefined,
    email: 'contacto@cocinasdelujo.mx',
    phone: '+52 55 1234 5678',
    address: 'Av. Reforma 123',
    city: 'Ciudad de México',
    state: 'CDMX',
    zipCode: '06600',
    taxId: 'CDL123456789',
    website: 'https://cocinasdelujo.mx'
  })

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }
  }, [session, status, router])

  // Load dashboard stats and company settings
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load stats
        const statsResponse = await fetch('/api/dashboard/stats')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }

        // Load company settings
        const settingsResponse = await fetch('/api/settings/company')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          if (settingsData.success && settingsData.data) {
            setCompanySettings({
              companyName: settingsData.data.companyName || '',
              logo: settingsData.data.logo || undefined,
              email: settingsData.data.email || '',
              phone: settingsData.data.phone || '',
              address: settingsData.data.address || '',
              city: settingsData.data.city || '',
              state: settingsData.data.state || '',
              zipCode: settingsData.data.zipCode || '',
              taxId: settingsData.data.taxId || '',
              website: settingsData.data.website || ''
            })
          }
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.role === 'ADMIN') {
      loadData()
    }
  }, [session])

  const handleLogoChange = (logoUrl: string | null) => {
    setCompanySettings({ 
      ...companySettings, 
      logo: logoUrl || undefined 
    })
  }

  const handleSaveCompanySettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companySettings),
      })

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "La información de la empresa ha sido actualizada.",
        })
      } else {
        throw new Error('Error al guardar configuración')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-red-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-gray-600">Gestiona la configuración del sistema y monitorea la actividad</p>
            </div>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      <p className="text-sm text-gray-600">Usuarios Totales</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Package className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                      <p className="text-sm text-gray-600">Productos</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalQuotes}</p>
                      <p className="text-sm text-gray-600">Cotizaciones</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeQuotes}</p>
                      <p className="text-sm text-gray-600">Cotizaciones Activas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="company" className="flex items-center space-x-2">
                <Building className="w-4 h-4" />
                <span>Empresa</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center space-x-2">
                <Package className="w-4 h-4" />
                <span>Productos</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Usuarios</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Actividad</span>
              </TabsTrigger>
            </TabsList>

            {/* Company Settings Tab */}
            <TabsContent value="company">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Configuración de Empresa</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Logo Upload Section */}
                  <div className="border-b border-gray-200 pb-6">
                    <LogoUpload
                      currentLogo={companySettings.logo}
                      onLogoChange={handleLogoChange}
                      className="max-w-md"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Nombre de la Empresa</Label>
                      <Input
                        id="companyName"
                        value={companySettings.companyName}
                        onChange={(e) => setCompanySettings({ ...companySettings, companyName: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">RFC</Label>
                      <Input
                        id="taxId"
                        value={companySettings.taxId}
                        onChange={(e) => setCompanySettings({ ...companySettings, taxId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyEmail">Correo Electrónico</Label>
                      <Input
                        id="companyEmail"
                        type="email"
                        value={companySettings.email}
                        onChange={(e) => setCompanySettings({ ...companySettings, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyPhone">Teléfono</Label>
                      <Input
                        id="companyPhone"
                        value={companySettings.phone}
                        onChange={(e) => setCompanySettings({ ...companySettings, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">Sitio Web</Label>
                      <Input
                        id="website"
                        value={companySettings.website || ''}
                        onChange={(e) => setCompanySettings({ ...companySettings, website: e.target.value })}
                        placeholder="https://ejemplo.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Código Postal</Label>
                      <Input
                        id="zipCode"
                        value={companySettings.zipCode}
                        onChange={(e) => setCompanySettings({ ...companySettings, zipCode: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyAddress">Dirección</Label>
                      <Input
                        id="companyAddress"
                        value={companySettings.address}
                        onChange={(e) => setCompanySettings({ ...companySettings, address: e.target.value })}
                        placeholder="Calle y número"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={companySettings.city}
                        onChange={(e) => setCompanySettings({ ...companySettings, city: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={companySettings.state}
                        onChange={(e) => setCompanySettings({ ...companySettings, state: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveCompanySettings}
                      disabled={saving}
                      className="flex items-center space-x-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="w-5 h-5" />
                      <span>Gestión de Productos</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-gray-600">
                      Administra el catálogo completo de productos, categorías y sus características.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Productos del Catálogo</h4>
                          <p className="text-sm text-gray-600">
                            {stats?.totalProducts || 0} productos registrados
                          </p>
                        </div>
                        <Package className="w-8 h-8 text-blue-600" />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">Categorías</h4>
                          <p className="text-sm text-gray-600">Organización del inventario</p>
                        </div>
                        <Folder className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <Link href="/admin/products">
                      <Button className="w-full flex items-center justify-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Administrar Productos</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Resumen de Inventario</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Productos Activos</span>
                        <Badge variant="default" className="bg-green-600">
                          {stats?.totalProducts || 0}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">En Cotizaciones</span>
                        <Badge variant="outline">
                          {stats?.activeQuotes || 0}
                        </Badge>
                      </div>
                      <div className="pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-3">Acciones Rápidas:</p>
                        <div className="space-y-2">
                          <Link href="/admin/products">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <Package className="w-4 h-4 mr-2" />
                              Ver Todos los Productos
                            </Button>
                          </Link>
                          <Link href="/admin/products?tab=categories">
                            <Button variant="outline" size="sm" className="w-full justify-start">
                              <Folder className="w-4 h-4 mr-2" />
                              Gestionar Categorías
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <UserManagement />
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Actividad Reciente</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.recentQuotes && stats.recentQuotes.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentQuotes.map((quote: any) => (
                        <div key={quote.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <BarChart3 className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">Cotización #{quote.id.slice(-6)}</p>
                              <p className="text-sm text-gray-600">
                                Cliente: {quote.customerName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Badge variant={quote.status === 'APPROVED' ? 'default' : 'secondary'}>
                              {quote.status}
                            </Badge>
                            <span className="font-medium text-green-600">
                              ${quote.total?.toLocaleString('es-MX') || '0'} MXN
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay cotizaciones recientes para mostrar</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
