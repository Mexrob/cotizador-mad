'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings
} from 'lucide-react'
import { createUserSchema } from '@/lib/validationSchemas'
import { z } from 'zod'

type UserFormData = z.infer<typeof createUserSchema>;

export interface DeliveryAddress {
  id?: string;
  street: string;
  exteriorNumber: string;
  interiorNumber?: string;
  colony: string;
  zipCode: string;
  city: string;
  state: string;
}

export interface BillingAddress {
  id?: string;
  street: string;
  number: string;
  colony: string;
  zipCode: string;
  city: string;
  state: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  phone2: string | null;
  companyName: string;
  taxId: string;
  fiscalRegime: string | null;
  cfdiUse: string | null;
  deliveryAddress: DeliveryAddress;
  billingAddress: BillingAddress | null;
  country: string;
  role: 'ADMIN' | 'DEALER' | 'RETAIL' | 'VIP' | 'WHOLESALE';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  discountRate: number;
  creditLimit: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    quotes: number;
  };
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  phone: '',
  phone2: '',
  companyName: '',
  taxId: '',
  fiscalRegime: '',
  cfdiUse: '',
  // Initialize deliveryAddress with default empty values as it's now required
  deliveryAddress: {
    street: '',
    exteriorNumber: '',
    interiorNumber: '',
    colony: '',
    zipCode: '',
    city: '',
    state: '',
  },
  billingAddress: {
    street: '',
    number: '',
    colony: '',
    zipCode: '',
    city: '',
    state: '',
  },
  country: 'Mexico',
  role: 'RETAIL',
  status: 'ACTIVE',
  discountRate: 0,
  creditLimit: 0,
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [useSameAddress, setUseSameAddress] = useState(false); // For "Usar el mismo domicilio de entrega" checkbox

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Form
  const [formData, setFormData] = useState<UserFormData>(initialFormData)
  const [formErrors, setFormErrors] = useState<any>({})

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(roleFilter && roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
      })

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los usuarios",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: "Error",
        description: "Error al cargar usuarios",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [pagination.page, search, roleFilter, statusFilter])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = createUserSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: { [key: string]: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          // Flatten nested errors for simplicity, e.g., deliveryAddress.street -> deliveryAddress.street
          const path = err.path.join('.');
          fieldErrors[path] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true)
    try {
      let response
      if (selectedUser) {
        // Update user
        response = await fetch(`/api/users/${selectedUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      } else {
        // Create user
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
      }

      if (response.ok) {
        toast({
          title: "Éxito",
          description: selectedUser ? "Usuario actualizado" : "Usuario creado",
        })
        setShowAddModal(false)
        setShowEditModal(false)
        resetForm()
        loadUsers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al guardar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar usuario",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Usuario eliminado",
        })
        loadUsers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al eliminar usuario",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar usuario",
        variant: "destructive",
      })
    }
  }

  // Handle role change
  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Rol actualizado",
        })
        loadUsers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al cambiar rol",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cambiar rol",
        variant: "destructive",
      })
    }
  }

  // Handle status change
  const handleStatusChange = async (userId: string, status: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Estado actualizado",
        })
        loadUsers()
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Error al cambiar estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cambiar estado",
        variant: "destructive",
      })
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData(initialFormData)
    setFormErrors({})
    setSelectedUser(null)
    setUseSameAddress(false); // Reset checkbox state
  }

  // Open edit modal
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password is not pre-filled for security
      phone: user.phone,
      phone2: user.phone2 || undefined,
      companyName: user.companyName,
      taxId: user.taxId,
      fiscalRegime: user.fiscalRegime || undefined,
      cfdiUse: user.cfdiUse || undefined,
      deliveryAddress: user.deliveryAddress,
      billingAddress: user.billingAddress || {
        street: '',
        number: '',
        colony: '',
        zipCode: '',
        city: '',
        state: '',
      }, // Provide a default empty object if null
      country: user.country,
      role: user.role,
      status: user.status,
      discountRate: user.discountRate,
      creditLimit: user.creditLimit,
    });
    // If billing address is identical to delivery address, set checkbox
    if (user.deliveryAddress && user.billingAddress &&
        user.deliveryAddress.street === user.billingAddress.street &&
        user.deliveryAddress.exteriorNumber === user.billingAddress.number && // Note: exteriorNumber vs number
        user.deliveryAddress.colony === user.billingAddress.colony &&
        user.deliveryAddress.zipCode === user.billingAddress.zipCode &&
        user.deliveryAddress.city === user.billingAddress.city &&
        user.deliveryAddress.state === user.billingAddress.state) {
      setUseSameAddress(true);
    } else {
      setUseSameAddress(false);
    }
    setShowEditModal(true);
  };

  // Open view modal
  const openViewModal = (user: User) => {
    setSelectedUser(user)
    setShowViewModal(true)
  }

  // Get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive'
      case 'DEALER': return 'default'
      case 'VIP': return 'secondary'
      default: return 'outline'
    }
  }

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default'
      case 'INACTIVE': return 'secondary'
      case 'PENDING': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Gestión de Usuarios</span>
            <Badge variant="outline">{pagination.total} usuarios</Badge>
          </div>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center space-x-2">
                <UserPlus className="w-4 h-4" />
                <span>Agregar Usuario</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Completa la información para crear un nuevo usuario en el sistema.
                </DialogDescription>
                <DialogDescription className="text-sm text-gray-500">
                  Los campos marcados con * son obligatorios.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Juan Pérez"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="juan@empresa.com"
                      className={formErrors.email ? 'border-red-500' : ''}
                    />
                    {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className={formErrors.password ? 'border-red-500' : ''}
                    />
                    {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono 1 *</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+52 55 1234 5678"
                      className={formErrors.phone ? 'border-red-500' : ''}
                    />
                    {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone2">Teléfono 2 (Opcional)</Label>
                    <Input
                      id="phone2"
                      value={formData.phone2}
                      onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                      placeholder="+52 55 8765 4321"
                    />
                  </div>
                </div>

                <h4 className="font-semibold text-lg mt-6 mb-2">Datos Fiscales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Razón Social *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName || ''}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="Empresa S.A. de C.V."
                      className={formErrors.companyName ? 'border-red-500' : ''}
                    />
                    {formErrors.companyName && <p className="text-red-500 text-sm">{formErrors.companyName}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">RFC *</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId || ''}
                      onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                      placeholder="ABC123456789"
                      className={formErrors.taxId ? 'border-red-500' : ''}
                    />
                    {formErrors.taxId && <p className="text-red-500 text-sm">{formErrors.taxId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscalRegime">Régimen Fiscal</Label>
                    <Input
                      id="fiscalRegime"
                      value={formData.fiscalRegime}
                      onChange={(e) => setFormData({ ...formData, fiscalRegime: e.target.value })}
                      placeholder="601 General de Ley Personas Morales"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cfdiUse">Uso de CFDI</Label>
                    <Input
                      id="cfdiUse"
                      value={formData.cfdiUse}
                      onChange={(e) => setFormData({ ...formData, cfdiUse: e.target.value })}
                      placeholder="G03 Gastos en general"
                    />
                  </div>
                </div>

                <h4 className="font-semibold text-lg mt-6 mb-2">Domicilio de Entrega</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryStreet">Calle *</Label>
                    <Input
                      id="deliveryStreet"
                      value={formData.deliveryAddress?.street || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, street: e.target.value } })}
                      placeholder="Av. Reforma"
                      className={formErrors['deliveryAddress.street'] ? 'border-red-500' : ''}
                    />
                    {formErrors['deliveryAddress.street'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.street']}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryExteriorNumber">Número Exterior *</Label>
                    <Input
                      id="deliveryExteriorNumber"
                      value={formData.deliveryAddress?.exteriorNumber || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, exteriorNumber: e.target.value } })}
                      placeholder="123"
                      className={formErrors['deliveryAddress.exteriorNumber'] ? 'border-red-500' : ''}
                    />
                    {formErrors['deliveryAddress.exteriorNumber'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.exteriorNumber']}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryInteriorNumber">Número Interior (Opcional)</Label>
                    <Input
                      id="deliveryInteriorNumber"
                      value={formData.deliveryAddress?.interiorNumber || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress, interiorNumber: e.target.value } as DeliveryAddress })}
                      placeholder="Piso 5, Depto 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryColony">Colonia *</Label>
                    <Input
                      id="deliveryColony"
                      value={formData.deliveryAddress?.colony || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, colony: e.target.value } })}
                      placeholder="Juárez"
                      className={formErrors['deliveryAddress.colony'] ? 'border-red-500' : ''}
                    />
                    {formErrors['deliveryAddress.colony'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.colony']}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryZipCode">Código Postal *</Label>
                    <Input
                      id="deliveryZipCode"
                      value={formData.deliveryAddress?.zipCode || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, zipCode: e.target.value } })}
                      placeholder="06600"
                      className={formErrors['deliveryAddress.zipCode'] ? 'border-red-500' : ''}
                    />
                    {formErrors['deliveryAddress.zipCode'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.zipCode']}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryCity">Ciudad *</Label>
                    <Input
                      id="deliveryCity"
                      value={formData.deliveryAddress?.city || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, city: e.target.value } })}
                      placeholder="Ciudad de México"
                      className={formErrors['deliveryAddress.city'] ? 'border-red-500' : ''}
                    />
                    {formErrors['deliveryAddress.city'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.city']}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deliveryState">Estado *</Label>
                    <Input
                      id="deliveryState"
                      value={formData.deliveryAddress?.state || ''}
                      onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, state: e.target.value } })}
                      placeholder="CDMX"
                      className={formErrors['deliveryAddress.state'] ? 'border-red-500' : ''}
                    />
                    {formErrors['deliveryAddress.state'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.state']}</p>}
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
                        setFormData(prev => ({
                          ...prev,
                          billingAddress: {
                            street: prev.deliveryAddress?.street || '',
                            number: prev.deliveryAddress?.exteriorNumber || '', // Map exteriorNumber to number for billing
                            colony: prev.deliveryAddress?.colony || '',
                            zipCode: prev.deliveryAddress?.zipCode || '',
                            city: prev.deliveryAddress?.city || '',
                            state: prev.deliveryAddress?.state || '',
                          },
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          billingAddress: {
                            street: '',
                            number: '',
                            colony: '',
                            zipCode: '',
                            city: '',
                            state: '',
                          },
                        }));
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
                        <Label htmlFor="billingStreet">Calle *</Label>
                        <Input
                          id="billingStreet"
                          value={formData.billingAddress?.street || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, street: e.target.value } })}
                          placeholder="Av. Insurgentes"
                          className={formErrors['billingAddress.street'] ? 'border-red-500' : ''}
                        />
                        {formErrors['billingAddress.street'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.street']}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingNumber">Número *</Label>
                        <Input
                          id="billingNumber"
                          value={formData.billingAddress?.number || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, number: e.target.value } })}
                          placeholder="456"
                          className={formErrors['billingAddress.number'] ? 'border-red-500' : ''}
                        />
                        {formErrors['billingAddress.number'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.number']}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingColony">Colonia *</Label>
                        <Input
                          id="billingColony"
                          value={formData.billingAddress?.colony || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, colony: e.target.value } })}
                          placeholder="Roma Norte"
                          className={formErrors['billingAddress.colony'] ? 'border-red-500' : ''}
                        />
                        {formErrors['billingAddress.colony'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.colony']}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingZipCode">Código Postal *</Label>
                        <Input
                          id="billingZipCode"
                          value={formData.billingAddress?.zipCode || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, zipCode: e.target.value } })}
                          placeholder="06700"
                          className={formErrors['billingAddress.zipCode'] ? 'border-red-500' : ''}
                        />
                        {formErrors['billingAddress.zipCode'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.zipCode']}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingCity">Ciudad *</Label>
                        <Input
                          id="billingCity"
                          value={formData.billingAddress?.city || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, city: e.target.value } })}
                          placeholder="Ciudad de México"
                          className={formErrors['billingAddress.city'] ? 'border-red-500' : ''}
                        />
                        {formErrors['billingAddress.city'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.city']}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="billingState">Estado *</Label>
                        <Input
                          id="billingState"
                          value={formData.billingAddress?.state || ''}
                          onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, state: e.target.value } })}
                          placeholder="CDMX"
                          className={formErrors['billingAddress.state'] ? 'border-red-500' : ''}
                        />
                        {formErrors['billingAddress.state'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.state']}</p>}
                      </div>
                    </div>
                  </>
                )}

                <h4 className="font-semibold text-lg mt-6 mb-2">Configuración de Usuario</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select value={formData.role} onValueChange={(value: "ADMIN" | "DEALER" | "RETAIL" | "VIP" | "WHOLESALE") => setFormData({ ...formData, role: value })}
                      name="role"
                    >
                      <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RETAIL">Retail</SelectItem>
                        <SelectItem value="DEALER">Dealer</SelectItem>
                        <SelectItem value="VIP">VIP</SelectItem>
                        <SelectItem value="WHOLESALE">Mayorista</SelectItem>
                        <SelectItem value="ADMIN">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.role && <p className="text-red-500 text-sm">{formErrors.role}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Estado *</Label>
                    <Select value={formData.status} onValueChange={(value: "ACTIVE" | "INACTIVE" | "PENDING") => setFormData({ ...formData, status: value })}
                      name="status"
                    >
                      <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Activo</SelectItem>
                        <SelectItem value="INACTIVE">Inactivo</SelectItem>
                        <SelectItem value="PENDING">Pendiente</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.status && <p className="text-red-500 text-sm">{formErrors.status}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="discountRate">Descuento (%)</Label>
                    <Input
                      id="discountRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.discountRate}
                      onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Límite de Crédito</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Guardando...' : 'Crear Usuario'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todos los roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los roles</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="DEALER">Dealer</SelectItem>
              <SelectItem value="RETAIL">Retail</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="WHOLESALE">Mayorista</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE">Activo</SelectItem>
              <SelectItem value="INACTIVE">Inactivo</SelectItem>
              <SelectItem value="PENDING">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-module-black"></div>
          </div>
        ) : users.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cotizaciones</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-module-black font-medium text-sm">
                            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{user.name || 'Sin nombre'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.companyName || 'Sin empresa'}</p>
                        {user.phone && (
                          <p className="text-sm text-muted-foreground">{user.phone}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                            {user.role}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RETAIL">Retail</SelectItem>
                          <SelectItem value="DEALER">Dealer</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                          <SelectItem value="WHOLESALE">Mayorista</SelectItem>
                          <SelectItem value="ADMIN">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.status}
                        onValueChange={(value) => handleStatusChange(user.id, value)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <Badge variant={getStatusBadgeVariant(user.status)} className="text-xs">
                            {user.status === 'ACTIVE' ? 'Activo' : user.status === 'INACTIVE' ? 'Inactivo' : 'Pendiente'}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Activo</SelectItem>
                          <SelectItem value="INACTIVE">Inactivo</SelectItem>
                          <SelectItem value="PENDING">Pendiente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{user._count.quotes}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('es-MX')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewModal(user)}
                          className="w-8 h-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(user)}
                          className="w-8 h-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la cuenta de {user.name || user.email}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay usuarios para mostrar</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} usuarios
            </p>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
              <span className="text-sm">
                Página {pagination.page} de {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
              <DialogDescription>
                Actualiza la información del usuario. Deja la contraseña en blanco para no cambiarla.
              </DialogDescription>
              <DialogDescription className="text-sm text-gray-500">
                Los campos marcados con * son obligatorios.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre Completo *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Juan Pérez"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="juan@empresa.com"
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
                  <Input
                    id="edit-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Teléfono 1 *</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+52 55 1234 5678"
                    className={formErrors.phone ? 'border-red-500' : ''}
                  />
                  {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone2">Teléfono 2 (Opcional)</Label>
                  <Input
                    id="edit-phone2"
                    value={formData.phone2}
                    onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                    placeholder="+52 55 8765 4321"
                  />
                </div>
              </div>

              <h4 className="font-semibold text-lg mt-6 mb-2">Datos Fiscales</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-companyName">Razón Social *</Label>
                  <Input
                    id="edit-companyName"
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Empresa S.A. de C.V."
                    className={formErrors.companyName ? 'border-red-500' : ''}
                  />
                  {formErrors.companyName && <p className="text-red-500 text-sm">{formErrors.companyName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-taxId">RFC *</Label>
                  <Input
                    id="edit-taxId"
                    value={formData.taxId || ''}
                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                    placeholder="ABC123456789"
                    className={formErrors.taxId ? 'border-red-500' : ''}
                  />
                  {formErrors.taxId && <p className="text-red-500 text-sm">{formErrors.taxId}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fiscalRegime">Régimen Fiscal</Label>
                  <Input
                    id="edit-fiscalRegime"
                    value={formData.fiscalRegime}
                    onChange={(e) => setFormData({ ...formData, fiscalRegime: e.target.value })}
                    placeholder="601 General de Ley Personas Morales"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cfdiUse">Uso de CFDI</Label>
                  <Input
                    id="edit-cfdiUse"
                    value={formData.cfdiUse}
                    onChange={(e) => setFormData({ ...formData, cfdiUse: e.target.value })}
                    placeholder="G03 Gastos en general"
                  />
                </div>
              </div>

              <h4 className="font-semibold text-lg mt-6 mb-2">Domicilio de Entrega</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryStreet">Calle *</Label>
                  <Input
                    id="edit-deliveryStreet"
                    value={formData.deliveryAddress?.street || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, street: e.target.value } })}
                    placeholder="Av. Reforma"
                    className={formErrors['deliveryAddress.street'] ? 'border-red-500' : ''}
                  />
                  {formErrors['deliveryAddress.street'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.street']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryExteriorNumber">Número Exterior *</Label>
                  <Input
                    id="edit-deliveryExteriorNumber"
                    value={formData.deliveryAddress?.exteriorNumber || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, exteriorNumber: e.target.value } })}
                    placeholder="123"
                    className={formErrors['deliveryAddress.exteriorNumber'] ? 'border-red-500' : ''}
                  />
                  {formErrors['deliveryAddress.exteriorNumber'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.exteriorNumber']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryInteriorNumber">Número Interior (Opcional)</Label>
                  <Input
                    id="edit-deliveryInteriorNumber"
                    value={formData.deliveryAddress?.interiorNumber || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress, interiorNumber: e.target.value } as DeliveryAddress })}
                    placeholder="Piso 5, Depto 101"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryColony">Colonia *</Label>
                  <Input
                    id="edit-deliveryColony"
                    value={formData.deliveryAddress?.colony || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, colony: e.target.value } })}
                    placeholder="Juárez"
                    className={formErrors['deliveryAddress.colony'] ? 'border-red-500' : ''}
                  />
                  {formErrors['deliveryAddress.colony'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.colony']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryZipCode">Código Postal *</Label>
                  <Input
                    id="edit-deliveryZipCode"
                    value={formData.deliveryAddress?.zipCode || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, zipCode: e.target.value } })}
                    placeholder="06600"
                    className={formErrors['deliveryAddress.zipCode'] ? 'border-red-500' : ''}
                  />
                  {formErrors['deliveryAddress.zipCode'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.zipCode']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryCity">Ciudad *</Label>
                  <Input
                    id="edit-deliveryCity"
                    value={formData.deliveryAddress?.city || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, city: e.target.value } })}
                    placeholder="Ciudad de México"
                    className={formErrors['deliveryAddress.city'] ? 'border-red-500' : ''}
                  />
                  {formErrors['deliveryAddress.city'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.city']}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-deliveryState">Estado *</Label>
                  <Input
                    id="edit-deliveryState"
                    value={formData.deliveryAddress?.state || ''}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: { ...formData.deliveryAddress!, state: e.target.value } })}
                    placeholder="CDMX"
                    className={formErrors['deliveryAddress.state'] ? 'border-red-500' : ''}
                  />
                  {formErrors['deliveryAddress.state'] && <p className="text-red-500 text-sm">{formErrors['deliveryAddress.state']}</p>}
                </div>
              </div>

              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="edit-useSameAddress"
                  checked={useSameAddress}
                  onChange={(e) => {
                    setUseSameAddress(e.target.checked);
                    if (e.target.checked) {
                      setFormData(prev => ({
                        ...prev,
                        billingAddress: {
                          street: prev.deliveryAddress?.street || '',
                          number: prev.deliveryAddress?.exteriorNumber || '', // Map exteriorNumber to number for billing
                          colony: prev.deliveryAddress?.colony || '',
                          zipCode: prev.deliveryAddress?.zipCode || '',
                          city: prev.deliveryAddress?.city || '',
                          state: prev.deliveryAddress?.state || '',
                        },
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        billingAddress: {
                          street: '',
                          number: '',
                          colony: '',
                          zipCode: '',
                          city: '',
                          state: '',
                        },
                      }));
                    }
                  }}
                  className="form-checkbox h-4 w-4 text-module-black"
                />
                <Label htmlFor="edit-useSameAddress">Usar el mismo domicilio de entrega para facturación</Label>
              </div>

              {!useSameAddress && (
                <>
                  <h4 className="font-semibold text-lg mt-6 mb-2">Domicilio Fiscal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-billingStreet">Calle *</Label>
                      <Input
                        id="edit-billingStreet"
                        value={formData.billingAddress?.street || ''}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, street: e.target.value } })}
                        placeholder="Av. Insurgentes"
                        className={formErrors['billingAddress.street'] ? 'border-red-500' : ''}
                      />
                      {formErrors['billingAddress.street'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.street']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-billingNumber">Número *</Label>
                      <Input
                        id="edit-billingNumber"
                        value={formData.billingAddress?.number || ''}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, number: e.target.value } })}
                        placeholder="456"
                        className={formErrors['billingAddress.number'] ? 'border-red-500' : ''}
                      />
                      {formErrors['billingAddress.number'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.number']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-billingColony">Colonia *</Label>
                      <Input
                        id="edit-billingColony"
                        value={formData.billingAddress?.colony || ''}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, colony: e.target.value } })}
                        placeholder="Roma Norte"
                        className={formErrors['billingAddress.colony'] ? 'border-red-500' : ''}
                      />
                      {formErrors['billingAddress.colony'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.colony']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-billingZipCode">Código Postal *</Label>
                      <Input
                        id="edit-billingZipCode"
                        value={formData.billingAddress?.zipCode || ''}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, zipCode: e.target.value } })}
                        placeholder="06700"
                        className={formErrors['billingAddress.zipCode'] ? 'border-red-500' : ''}
                      />
                      {formErrors['billingAddress.zipCode'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.zipCode']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-billingCity">Ciudad *</Label>
                      <Input
                        id="edit-billingCity"
                        value={formData.billingAddress?.city || ''}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, city: e.target.value } })}
                        placeholder="Ciudad de México"
                        className={formErrors['billingAddress.city'] ? 'border-red-500' : ''}
                      />
                      {formErrors['billingAddress.city'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.city']}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-billingState">Estado *</Label>
                      <Input
                        id="edit-billingState"
                        value={formData.billingAddress?.state || ''}
                        onChange={(e) => setFormData({ ...formData, billingAddress: { ...formData.billingAddress!, state: e.target.value } })}
                        placeholder="CDMX"
                        className={formErrors['billingAddress.state'] ? 'border-red-500' : ''}
                      />
                      {formErrors['billingAddress.state'] && <p className="text-red-500 text-sm">{formErrors['billingAddress.state']}</p>}
                    </div>
                  </div>
                </>
              )}

              <h4 className="font-semibold text-lg mt-6 mb-2">Configuración de Usuario</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rol *</Label>
                  <Select value={formData.role} onValueChange={(value: "ADMIN" | "DEALER" | "RETAIL" | "VIP" | "WHOLESALE") => setFormData({ ...formData, role: value })}
                    name="role"
                  >
                    <SelectTrigger className={formErrors.role ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RETAIL">Retail</SelectItem>
                      <SelectItem value="DEALER">Dealer</SelectItem>
                      <SelectItem value="VIP">VIP</SelectItem>
                      <SelectItem value="WHOLESALE">Mayorista</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.role && <p className="text-red-500 text-sm">{formErrors.role}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Estado *</Label>
                  <Select value={formData.status} onValueChange={(value: "ACTIVE" | "INACTIVE" | "PENDING") => setFormData({ ...formData, status: value })}
                    name="status"
                  >
                    <SelectTrigger className={formErrors.status ? 'border-red-500' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.status && <p className="text-red-500 text-sm">{formErrors.status}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-discountRate">Descuento (%)</Label>
                  <Input
                    id="edit-discountRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.discountRate}
                    onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-creditLimit">Límite de Crédito</Label>
                  <Input
                    id="edit-creditLimit"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : 'Actualizar Usuario'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Modal */}
        <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Usuario</DialogTitle>
              <DialogDescription>
                Información completa del usuario seleccionado.
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-module-black font-bold text-xl">
                      {selectedUser.name?.charAt(0) || selectedUser.email.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedUser.name || 'Sin nombre'}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                        {selectedUser.role}
                      </Badge>
                      <Badge variant={getStatusBadgeVariant(selectedUser.status)}>
                        {selectedUser.status === 'ACTIVE' ? 'Activo' : selectedUser.status === 'INACTIVE' ? 'Inactivo' : 'Pendiente'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Building className="w-4 h-4 mr-2" />
                      Información de Empresa
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Empresa:</span> {selectedUser.companyName || 'No especificada'}</p>
                      <p><span className="font-medium">RFC:</span> {selectedUser.taxId || 'No especificado'}</p>
                      <p><span className="font-medium">Teléfono 1:</span> {selectedUser.phone || 'No especificado'}</p>
                      <p><span className="font-medium">Teléfono 2:</span> {selectedUser.phone2 || 'No especificado'}</p>
                      <p><span className="font-medium">Régimen Fiscal:</span> {selectedUser.fiscalRegime || 'No especificado'}</p>
                      <p><span className="font-medium">Uso de CFDI:</span> {selectedUser.cfdiUse || 'No especificado'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Configuración
                    </h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Descuento:</span> {selectedUser.discountRate}%</p>
                      <p><span className="font-medium">Límite de Crédito:</span> ${selectedUser.creditLimit.toLocaleString('es-MX')} MXN</p>
                      <p><span className="font-medium">Cotizaciones:</span> {selectedUser._count.quotes}</p>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-3">Domicilio de Entrega</h4>
                    <div className="text-sm">
                      {selectedUser.deliveryAddress ? (
                        <p>
                          {[
                            selectedUser.deliveryAddress.street,
                            selectedUser.deliveryAddress.exteriorNumber,
                            selectedUser.deliveryAddress.interiorNumber,
                            selectedUser.deliveryAddress.colony,
                            selectedUser.deliveryAddress.zipCode,
                            selectedUser.deliveryAddress.city,
                            selectedUser.deliveryAddress.state,
                          ].filter(Boolean).join(', ')}
                        </p>
                      ) : (
                        <p className="text-gray-500">No especificado</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-3">Domicilio Fiscal</h4>
                    <div className="text-sm">
                      {selectedUser.billingAddress ? (
                        <p>
                          {[
                            selectedUser.billingAddress.street,
                            selectedUser.billingAddress.number,
                            selectedUser.billingAddress.colony,
                            selectedUser.billingAddress.zipCode,
                            selectedUser.billingAddress.city,
                            selectedUser.billingAddress.state,
                          ].filter(Boolean).join(', ')}
                        </p>
                      ) : (
                        <p className="text-gray-500">No especificado</p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <h4 className="font-semibold mb-3">Información del Sistema</h4>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Creado:</span> {new Date(selectedUser.createdAt).toLocaleString('es-MX')}</p>
                      <p><span className="font-medium">Actualizado:</span> {new Date(selectedUser.updatedAt).toLocaleString('es-MX')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
