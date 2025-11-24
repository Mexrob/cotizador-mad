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

interface DeliveryAddress {
  id?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  colony: string;
  zipCode: string;
  city: string;
  state: string;
}

interface BillingAddress {
  id?: string;
  street: string;
  number: string;
  colony: string;
  zipCode: string;
  city: string;
  state: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phone2?: string;
  companyName?: string;
  taxId?: string;
  fiscalRegime?: string;
  cfdiUse?: string;
  deliveryAddress?: DeliveryAddress;
  billingAddress?: BillingAddress;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [useSameAddress, setUseSameAddress] = useState(false); // For "Usar el mismo domicilio de entrega" checkbox

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
          // Set useSameAddress checkbox based on loaded data
          if (userData.deliveryAddress && userData.billingAddress &&
            userData.deliveryAddress.street === userData.billingAddress.street &&
            userData.deliveryAddress.exteriorNumber === userData.billingAddress.number &&
            userData.deliveryAddress.colony === userData.billingAddress.colony &&
            userData.deliveryAddress.zipCode === userData.billingAddress.zipCode &&
            userData.deliveryAddress.city === userData.billingAddress.city &&
            userData.deliveryAddress.state === userData.billingAddress.state) {
            setUseSameAddress(true);
          } else {
            setUseSameAddress(false);
          }
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
          phone2: profile.phone2,
          companyName: profile.companyName,
          taxId: profile.taxId,
          fiscalRegime: profile.fiscalRegime,
          cfdiUse: profile.cfdiUse,
          deliveryAddress: profile.deliveryAddress,
          billingAddress: useSameAddress ? profile.deliveryAddress ? { ...profile.deliveryAddress, number: profile.deliveryAddress.exteriorNumber || '' } : null : profile.billingAddress,
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
      case 'WHOLESALE': return 'bg-gray-100 text-gray-800'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-module-black mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-module-black rounded-lg">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
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
                      <Label htmlFor="phone">Teléfono 1</Label>
                      <Input
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="Tu número de teléfono"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone2">Teléfono 2 (Opcional)</Label>
                      <Input
                        id="phone2"
                        value={profile.phone2 || ''}
                        onChange={(e) => setProfile({ ...profile, phone2: e.target.value })}
                        placeholder="Tu número de teléfono secundario"
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-lg mt-6 mb-2">Datos Fiscales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Razón Social</Label>
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
                    <div className="space-y-2">
                      <Label htmlFor="fiscalRegime">Régimen Fiscal</Label>
                      <Input
                        id="fiscalRegime"
                        value={profile.fiscalRegime || ''}
                        onChange={(e) => setProfile({ ...profile, fiscalRegime: e.target.value })}
                        placeholder="601 General de Ley Personas Morales"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cfdiUse">Uso de CFDI</Label>
                      <Input
                        id="cfdiUse"
                        value={profile.cfdiUse || ''}
                        onChange={(e) => setProfile({ ...profile, cfdiUse: e.target.value })}
                        placeholder="G03 Gastos en general"
                      />
                    </div>
                  </div>

                  <h4 className="font-semibold text-lg mt-6 mb-2">Domicilio de Entrega</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deliveryStreet">Calle</Label>
                      <Input
                        id="deliveryStreet"
                        value={profile.deliveryAddress?.street || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, street: e.target.value } as DeliveryAddress })}
                        placeholder="Av. Reforma"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryExteriorNumber">Número Exterior</Label>
                      <Input
                        id="deliveryExteriorNumber"
                        value={profile.deliveryAddress?.exteriorNumber || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, exteriorNumber: e.target.value } as DeliveryAddress })}
                        placeholder="123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryInteriorNumber">Número Interior (Opcional)</Label>
                      <Input
                        id="deliveryInteriorNumber"
                        value={profile.deliveryAddress?.interiorNumber || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, interiorNumber: e.target.value } as DeliveryAddress })}
                        placeholder="Piso 5, Depto 101"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryColony">Colonia</Label>
                      <Input
                        id="deliveryColony"
                        value={profile.deliveryAddress?.colony || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, colony: e.target.value } as DeliveryAddress })}
                        placeholder="Juárez"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryZipCode">Código Postal</Label>
                      <Input
                        id="deliveryZipCode"
                        value={profile.deliveryAddress?.zipCode || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, zipCode: e.target.value } as DeliveryAddress })}
                        placeholder="06600"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryCity">Ciudad</Label>
                      <Input
                        id="deliveryCity"
                        value={profile.deliveryAddress?.city || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, city: e.target.value } as DeliveryAddress })}
                        placeholder="Ciudad de México"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliveryState">Estado</Label>
                      <Input
                        id="deliveryState"
                        value={profile.deliveryAddress?.state || ''}
                        onChange={(e) => setProfile({ ...profile, deliveryAddress: { ...profile.deliveryAddress, state: e.target.value } as DeliveryAddress })}
                        placeholder="CDMX"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <input
                      type="checkbox"
                      id="useSameAddress"
                      checked={useSameAddress}
                      onChange={(e) => {
                        setUseSameAddress(e.target.checked);
                        if (e.target.checked) {
                          setProfile(prev => ({
                            ...prev!,
                            billingAddress: prev?.deliveryAddress ? {
                              ...prev.deliveryAddress,
                              number: prev.deliveryAddress.exteriorNumber || ''
                            } as BillingAddress : undefined
                          }));
                        } else {
                          setProfile(prev => ({ ...prev!, billingAddress: undefined }));
                        }
                      }}
                      className="form-checkbox h-4 w-4 text-module-black"
                    />
                    <Label htmlFor="useSameAddress">Usar el mismo domicilio de entrega para facturación</Label>
                  </div>

                  {!useSameAddress && (
                    <>
                      <h4 className="font-semibold text-lg mt-6 mb-2">Domicilio Fiscal</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="billingStreet">Calle</Label>
                          <Input
                            id="billingStreet"
                            value={profile.billingAddress?.street || ''}
                            onChange={(e) => setProfile({ ...profile, billingAddress: { ...profile.billingAddress, street: e.target.value } as BillingAddress })}
                            placeholder="Av. Insurgentes"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingNumber">Número</Label>
                          <Input
                            id="billingNumber"
                            value={profile.billingAddress?.number || ''}
                            onChange={(e) => setProfile({ ...profile, billingAddress: { ...profile.billingAddress, number: e.target.value } as BillingAddress })}
                            placeholder="456"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingColony">Colonia</Label>
                          <Input
                            id="billingColony"
                            value={profile.billingAddress?.colony || ''}
                            onChange={(e) => setProfile({ ...profile, billingAddress: { ...profile.billingAddress, colony: e.target.value } as BillingAddress })}
                            placeholder="Roma Norte"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingZipCode">Código Postal</Label>
                          <Input
                            id="billingZipCode"
                            value={profile.billingAddress?.zipCode || ''}
                            onChange={(e) => setProfile({ ...profile, billingAddress: { ...profile.billingAddress, zipCode: e.target.value } as BillingAddress })}
                            placeholder="06700"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingCity">Ciudad</Label>
                          <Input
                            id="billingCity"
                            value={profile.billingAddress?.city || ''}
                            onChange={(e) => setProfile({ ...profile, billingAddress: { ...profile.billingAddress, city: e.target.value } as BillingAddress })}
                            placeholder="Ciudad de México"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="billingState">Estado</Label>
                          <Input
                            id="billingState"
                            value={profile.billingAddress?.state || ''}
                            onChange={(e) => setProfile({ ...profile, billingAddress: { ...profile.billingAddress, state: e.target.value } as BillingAddress })}
                            placeholder="CDMX"
                          />
                        </div>
                      </div>
                    </>
                  )}

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
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Teléfono 1</p>
                          <p className="text-sm text-gray-500">{profile.phone || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Teléfono 2</p>
                          <p className="text-sm text-gray-500">{profile.phone2 || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Razón Social</p>
                          <p className="text-sm text-gray-500">{profile.companyName || 'No especificada'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">RFC</p>
                          <p className="text-sm text-gray-500">{profile.taxId || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Régimen Fiscal</p>
                          <p className="text-sm text-gray-500">{profile.fiscalRegime || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Uso de CFDI</p>
                          <p className="text-sm text-gray-500">{profile.cfdiUse || 'No especificado'}</p>
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

                    <div className="flex items-center justify-between py-3 border-b">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Domicilio de Entrega</p>
                          <p className="text-sm text-gray-500">
                            {profile.deliveryAddress ? (
                              [
                                profile.deliveryAddress.street,
                                profile.deliveryAddress.exteriorNumber,
                                profile.deliveryAddress.interiorNumber,
                                profile.deliveryAddress.colony,
                                profile.deliveryAddress.zipCode,
                                profile.deliveryAddress.city,
                                profile.deliveryAddress.state,
                              ].filter(Boolean).join(', ')
                            ) : (
                              'No especificado'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Domicilio Fiscal</p>
                          <p className="text-sm text-gray-500">
                            {profile.billingAddress ? (
                              [
                                profile.billingAddress.street,
                                profile.billingAddress.number,
                                profile.billingAddress.colony,
                                profile.billingAddress.zipCode,
                                profile.billingAddress.city,
                                profile.billingAddress.state,
                              ].filter(Boolean).join(', ')
                            ) : (
                              'No especificado'
                            )}
                          </p>
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
                          <div className="flex items-center space-x-2 text-module-black">
                            <div className="w-2 h-2 bg-module-black rounded-full"></div>
                            <span>Precios especiales para distribuidores</span>
                          </div>
                          <div className="flex items-center space-x-2 text-module-black">
                            <div className="w-2 h-2 bg-module-black rounded-full"></div>
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

                      <div className="flex items-center space-x-2 text-muted-foreground">
                        <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                        <span>Configurador de cocinas personalizado</span>
                      </div>
                      <div className="flex items-center space-x-2 text-muted-foreground">
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
