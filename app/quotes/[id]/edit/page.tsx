
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { formatMXN } from '@/lib/utils'
import {
  ArrowLeft,
  Save,
  Loader2,
  User,
  Building,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  AlertCircle
} from 'lucide-react'

interface Quote {
  id: string
  quoteNumber: string
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  customerName: string
  customerEmail: string
  customerPhone?: string
  customerAddress?: string
  projectName: string
  projectAddress?: string
  roomDimensions?: {
    width: number
    height: number
    depth: number
  }
  subtotal: number
  taxAmount: number
  discountAmount?: number
  totalAmount: number
  validUntil: string
  deliveryDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function EditQuotePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [quote, setQuote] = useState<Quote | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    projectName: '',
    projectAddress: '',
    notes: '',
    deliveryDate: '',
    discountAmount: 0,
    status: 'PENDING' as Quote['status']
  })

  useEffect(() => {
    if (params.id) {
      fetchQuote()
    }
  }, [params.id])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/quotes/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const quoteData = data.data
        setQuote(quoteData)
        setFormData({
          customerName: quoteData.customerName || '',
          customerEmail: quoteData.customerEmail || '',
          customerPhone: quoteData.customerPhone || '',
          customerAddress: quoteData.customerAddress || '',
          projectName: quoteData.projectName || '',
          projectAddress: quoteData.projectAddress || '',
          notes: quoteData.notes || '',
          deliveryDate: quoteData.deliveryDate ? new Date(quoteData.deliveryDate).toISOString().split('T')[0] : '',
          discountAmount: quoteData.discountAmount || 0,
          status: quoteData.status || 'PENDING'
        })
      } else {
        setError(data.error || 'Error al cargar la cotización')
      }
    } catch (err) {
      setError('Error de conexión al cargar la cotización')
      console.error('Error fetching quote:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const response = await fetch(`/api/quotes/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: 'Cotización actualizada',
          description: 'Los cambios se han guardado exitosamente',
        })
        router.push(`/quotes/${params.id}`)
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Error al actualizar la cotización',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error de conexión al guardar los cambios',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-module-black mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Cargando cotización...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Error al cargar cotización
            </h2>
            <p className="text-muted-foreground mb-6">
              {error || 'La cotización no fue encontrada'}
            </p>
            <div className="space-x-2">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <Button onClick={fetchQuote}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-module-black to-module-dark text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/quotes/${params.id}`}>
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver a Detalles
                </Button>
              </Link>
              <div>
                <motion.h1
                  className="text-2xl md:text-3xl font-bold"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Editar Cotización
                </motion.h1>
                <motion.p
                  className="text-gray-100 flex items-center gap-2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <FileText className="w-4 h-4" />
                  {quote.quoteNumber} - {quote.projectName}
                </motion.p>
              </div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 lg:mt-0"
            >
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="secondary"
                size="lg"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Nombre del Cliente *</Label>
                    <Input
                      id="customerName"
                      value={formData.customerName}
                      onChange={(e) => handleInputChange('customerName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerEmail">Email del Cliente *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="customerPhone">Teléfono del Cliente</Label>
                    <Input
                      id="customerPhone"
                      value={formData.customerPhone}
                      onChange={(e) => handleInputChange('customerPhone', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="customerAddress">Dirección del Cliente</Label>
                  <Textarea
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => handleInputChange('customerAddress', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Project Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectName">Nombre del Proyecto *</Label>
                    <Input
                      id="projectName"
                      value={formData.projectName}
                      onChange={(e) => handleInputChange('projectName', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="deliveryDate">Fecha de Entrega</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={formData.deliveryDate}
                      onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="projectAddress">Dirección del Proyecto</Label>
                  <Textarea
                    id="projectAddress"
                    value={formData.projectAddress}
                    onChange={(e) => handleInputChange('projectAddress', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notas y Comentarios</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    placeholder="Notas adicionales sobre el proyecto..."
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quote Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Configuración de la Cotización
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="status">Estado de la Cotización</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: Quote['status']) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Borrador</SelectItem>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                        <SelectItem value="APPROVED">Aprobada</SelectItem>
                        <SelectItem value="REJECTED">Rechazada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discountAmount">Descuento (MXN)</Label>
                    <Input
                      id="discountAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => handleInputChange('discountAmount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-3">Resumen de Precios</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatMXN(quote.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA (16%):</span>
                      <span>{formatMXN(quote.taxAmount)}</span>
                    </div>
                    {formData.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Descuento:</span>
                        <span>-{formatMXN(formData.discountAmount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>{formatMXN(quote.subtotal + quote.taxAmount - formData.discountAmount)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex justify-end space-x-4"
          >
            <Link href={`/quotes/${params.id}`}>
              <Button variant="outline" size="lg">
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
