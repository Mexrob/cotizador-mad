'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Edit,
  Trash2,
  Loader2,
  Save,
  X,
  Info,
  Settings,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'

interface WizardStepDefinition {
  id: string
  name: string
  code: string
  componentName: string
  componentPath: string
  description: string | null
  icon: string | null
  isSystem: boolean
  configSchema: unknown | null
  defaultConfig: unknown | null
  stepType: 'STANDARD' | 'CUSTOM' | 'CONDITIONAL' | 'CALCULATION'
  createdAt: string
  updatedAt: string
}

const stepTypeLabels: Record<string, string> = {
  STANDARD: 'Estándar',
  CUSTOM: 'Personalizado',
  CONDITIONAL: 'Condicional',
  CALCULATION: 'Cálculo',
}

export function WizardStepDefinitionsAdmin() {
  const [steps, setSteps] = useState<WizardStepDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<WizardStepDefinition | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    componentName: '',
    componentPath: '',
    description: '',
    icon: '',
    isSystem: false,
    stepType: 'STANDARD' as 'STANDARD' | 'CUSTOM' | 'CONDITIONAL' | 'CALCULATION',
  })

  useEffect(() => {
    fetchSteps()
  }, [])

  const fetchSteps = async () => {
    try {
      const res = await fetch('/api/admin/wizard-step-definitions')
      const data = await res.json()
      if (data.success) {
        setSteps(data.data)
      } else {
        toast.error('Error al cargar los pasos')
      }
    } catch (error) {
      console.error('Error fetching steps:', error)
      toast.error('Error al cargar los pasos')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (step?: WizardStepDefinition) => {
    if (step) {
      setEditingStep(step)
      setFormData({
        name: step.name,
        code: step.code,
        componentName: step.componentName,
        componentPath: step.componentPath || '',
        description: step.description || '',
        icon: step.icon || '',
        isSystem: step.isSystem,
        stepType: step.stepType,
      })
    } else {
      setEditingStep(null)
      setFormData({
        name: '',
        code: '',
        componentName: '',
        componentPath: '',
        description: '',
        icon: '',
        isSystem: false,
        stepType: 'STANDARD',
      })
    }
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const url = editingStep
        ? `/api/admin/wizard-step-definitions/${editingStep.id}`
        : '/api/admin/wizard-step-definitions'
      const method = editingStep ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        toast.success(editingStep ? 'Paso actualizado' : 'Paso creado')
        setDialogOpen(false)
        fetchSteps()
      } else {
        toast.error(data.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error saving step:', error)
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este paso?')) return

    try {
      const res = await fetch(`/api/admin/wizard-step-definitions/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (data.success) {
        toast.success('Paso eliminado')
        fetchSteps()
      } else {
        toast.error(data.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting step:', error)
      toast.error('Error al eliminar')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Definiciones de Pasos</h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los tipos de pasos disponibles para los wizards
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Paso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStep ? 'Editar Paso' : 'Nuevo Paso'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Selección de Categoría"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Código *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="category-selection"
                    disabled={!!editingStep?.isSystem}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="componentName">Componente *</Label>
                  <Input
                    id="componentName"
                    value={formData.componentName}
                    onChange={(e) =>
                      setFormData({ ...formData, componentName: e.target.value })
                    }
                    placeholder="StepCategory"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="componentPath">Ruta del Componente</Label>
                  <Input
                    id="componentPath"
                    value={formData.componentPath}
                    onChange={(e) =>
                      setFormData({ ...formData, componentPath: e.target.value })
                    }
                    placeholder="@/components/wizard-steps/..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stepType">Tipo de Paso</Label>
                  <Select
                    value={formData.stepType}
                    onValueChange={(value: 'STANDARD' | 'CUSTOM' | 'CONDITIONAL' | 'CALCULATION') =>
                      setFormData({ ...formData, stepType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDARD">Estándar</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                      <SelectItem value="CONDITIONAL">Condicional</SelectItem>
                      <SelectItem value="CALCULATION">Cálculo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">Icono</Label>
                  <Input
                    id="icon"
                    value={formData.icon || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="LayoutGrid"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción del paso..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isSystem"
                  checked={formData.isSystem}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isSystem: checked })
                  }
                  disabled={!!editingStep?.isSystem}
                />
                <Label htmlFor="isSystem">Paso del sistema</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingStep ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Pasos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Componente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sistema</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Info className="h-8 w-8" />
                      <p>No hay pasos registrados</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                steps.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-medium">{step.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {step.code}
                      </code>
                    </TableCell>
                    <TableCell>{step.componentName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {stepTypeLabels[step.stepType]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {step.isSystem ? (
                        <Badge variant="secondary">Sistema</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(step)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!step.isSystem && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(step.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
