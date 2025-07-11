
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Save, 
  Shield,
  Calendar,
  Settings
} from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  phone?: string
  companyName?: string
  taxId?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!session?.user?.id) return
      
      try {
        const response = await fetch(`/api/users/${session.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setProfile(userData)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      loadProfile()
    }
  }, [session])

  const handleSaveProfile = async () => {
    if (!profile || !session?.user?.id) return

    setSaving(true)
    try {
      const response = await fetch(`/api/users/${session.user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          companyName: profile.companyName,
          taxId: profile.taxId,
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
        }),
      })

      if (response.ok) {
        toast({
          title: "Perfil actualizado",
          description: "Tu información ha sido guardada exitosamente.",
        })
      } else {
        throw new Error('Error al actualizar perfil')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800'
      case 'DEALER': return 'bg-purple-100 text-purple-800'
      case 'VIP': return 'bg-yellow-100 text-yellow-800'
      case 'WHOLESALE': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador'
      case 'DEALER': return 'Distribuidor'
      case 'VIP': return 'Cliente VIP'
      case 'WHOLESALE': return 'Mayorista'
      case 'RETAIL': return 'Cliente Retail'
      default: return role
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal y configuración</p>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Información Personal</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Configuración de Cuenta</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Información Personal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input
                        id="name"
                        value={profile.name || ''}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-gray-50"
                      />
                      <p className="text-xs text-gray-500">
                        El correo electrónico no se puede cambiar
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Tu número de teléfono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName">Empresa</Label>
                      <Input
                        id="companyName"
                        value={profile.companyName || ''}
                        onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                        placeholder="Nombre de tu empresa"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="taxId">RFC</Label>
                      <Input
                        id="taxId"
                        value={profile.taxId || ''}
                        onChange={(e) => setProfile({ ...profile, taxId: e.target.value })}
                        placeholder="RFC de la empresa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección</Label>
                      <Input
                        id="address"
                        value={profile.address || ''}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        placeholder="Calle y número"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad</Label>
                      <Input
                        id="city"
                        value={profile.city || ''}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        placeholder="Ciudad"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">Estado</Label>
                      <Input
                        id="state"
                        value={profile.state || ''}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        placeholder="Estado"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Código Postal</Label>
                      <Input
                        id="zipCode"
                        value={profile.zipCode || ''}
                        onChange={(e) => setProfile({ ...profile, zipCode: e.target.value })}
                        placeholder="Código postal"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <Button
                      onClick={handleSaveProfile}
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

            {/* Account Tab */}
            <TabsContent value="account">
              <div className="space-y-6">
                {/* Account Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5" />
                      <span>Información de Cuenta</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Correo Electrónico</p>
                          <p className="text-sm text-gray-500">{profile.email}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Shield className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Tipo de Cuenta</p>
                          <Badge className={getRoleBadgeColor(profile.role)}>
                            {getRoleDisplayName(profile.role)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Miembro desde</p>
                          <p className="text-sm text-gray-500">
                            {new Date(profile.createdAt).toLocaleDateString('es-MX', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Role Benefits */}
                <Card>
                  <CardHeader>
                    <CardTitle>Beneficios de tu Cuenta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {profile.role === 'ADMIN' && (
                        <>
                          <div className="flex items-center space-x-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span>Acceso completo al panel de administración</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span>Gestión de productos y precios</span>
                          </div>
                          <div className="flex items-center space-x-2 text-green-600">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span>Reportes y estadísticas avanzadas</span>
                          </div>
                        </>
                      )}
                      
                      {profile.role === 'DEALER' && (
                        <>
                          <div className="flex items-center space-x-2 text-blue-600">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span>Precios especiales para distribuidores</span>
                          </div>
                          <div className="flex items-center space-x-2 text-blue-600">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span>Descuentos por volumen</span>
                          </div>
                        </>
                      )}
                      
                      {profile.role === 'VIP' && (
                        <>
                          <div className="flex items-center space-x-2 text-yellow-600">
                            <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                            <span>Atención prioritaria</span>
                          </div>
                          <div className="flex items-center space-x-2 text-yellow-600">
                            <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                            <span>Acceso a productos exclusivos</span>
                          </div>
                        </>
                      )}
                      
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        <span>Configurador de cocinas personalizado</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        <span>Historial de cotizaciones</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
