'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Settings,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { UserRole } from '@prisma/client'
import {
  WizardStepConfig,
  AVAILABLE_STEP_DEFINITIONS,
  StepDefinitionMetadata,
} from '@/lib/wizard-configurable/types'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

// DnD Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ==================== Interfaces ====================

interface WizardTemplate {
  id: string
  name: string
  code: string
  description: string | null
  isActive: boolean
  isDefault: boolean
  stepsConfig: WizardStepConfig[]
  pricingConfig?: unknown
  validationRules?: unknown
  uiConfig?: unknown
}

interface WizardAssignment {
  id: string
  templateId: string
  userId: string | null
  role: UserRole | null
  priority: number
  user?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface UserOption {
  id: string
  name: string | null
  email: string
  role: string
}

interface Assignment {
  id?: string
  userId: string | null
  role: string | null
  priority: number
  validFrom: string | null
  validUntil: string | null
  user?: UserOption | null
}

// ==================== Main Component ====================

export function WizardAdminPanel() {
  const [templates, setTemplates] = useState<WizardTemplate[]>([])
  const [assignments, setAssignments] = useState<WizardAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<WizardTemplate | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadTemplates()
    loadAssignments()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/admin/wizard-templates')
      const result = await response.json()
      if (result.success) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const loadAssignments = async () => {
    try {
      const response = await fetch('/api/admin/wizard-assignments')
      const result = await response.json()
      if (result.success) {
        setAssignments(result.data)
      }
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (template: WizardTemplate) => {
    try {
      const response = await fetch('/api/admin/wizard-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (Copia)`,
          code: `${template.code}-copy`,
          isDefault: false,
        }),
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Wizard duplicado correctamente')
        loadTemplates()
      } else {
        toast.error(result.error || 'Error al duplicar')
      }
    } catch (error) {
      console.error('Error duplicating template:', error)
      toast.error('Error al duplicar wizard')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este wizard?')) return

    try {
      const response = await fetch(`/api/admin/wizard-templates/${id}`, {
        method: 'DELETE',
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Wizard eliminado correctamente')
        loadTemplates()
      } else {
        toast.error(result.error || 'Error al eliminar')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar wizard')
    }
  }

  const handleEdit = (template: WizardTemplate) => {
    setSelectedTemplate(template)
    setIsEditing(true)
  }

  const handleCreate = () => {
    setSelectedTemplate(null)
    setIsCreating(true)
  }

  const handleClose = () => {
    setIsEditing(false)
    setIsCreating(false)
    setSelectedTemplate(null)
  }

  const handleSave = () => {
    loadTemplates()
    handleClose()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Configuración de Wizards</h1>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Wizard
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">{template.code}</CardDescription>
                </div>
                <div className="flex gap-1">
                  {template.isDefault && (
                    <Badge variant="default" className="text-xs">
                      Default
                    </Badge>
                  )}
                  {!template.isActive && (
                    <Badge variant="secondary" className="text-xs">
                      Inactivo
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4">
                {template.description || 'Sin descripción'}
              </p>
              <div className="text-xs text-muted-foreground mb-4">
                {template.stepsConfig.length} pasos configurados
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(template)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay wizards configurados</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer wizard para comenzar
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Wizard
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing || isCreating} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Editar Wizard' : 'Crear Nuevo Wizard'}
            </DialogTitle>
          </DialogHeader>
          <WizardEditor
            template={selectedTemplate || undefined}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==================== Wizard Editor ====================

interface WizardEditorProps {
  template?: WizardTemplate
  onSave: () => void
  onCancel: () => void
}

function WizardEditor({
  template,
  onSave,
  onCancel,
}: WizardEditorProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [users, setUsers] = useState<UserOption[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loadingAssignments, setLoadingAssignments] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    code: string
    description: string
    isActive: boolean
    isDefault: boolean
    stepsConfig: WizardStepConfig[]
    pricingConfig?: unknown
    validationRules?: unknown
    uiConfig?: unknown
  }>({
    name: template?.name || '',
    code: template?.code || '',
    description: template?.description || '',
    isActive: template?.isActive ?? true,
    isDefault: template?.isDefault ?? false,
    stepsConfig: template?.stepsConfig || [],
    pricingConfig: template?.pricingConfig || {
      baseFormula: 'glass-calculation',
      adjustments: [],
      rounding: 'nearest',
      roundingPrecision: 2
    },
    validationRules: template?.validationRules || { rules: [] },
    uiConfig: template?.uiConfig || {
      layout: {
        showProgressBar: true,
        showStepNumbers: true,
        allowSkip: false,
        allowBack: true
      }
    },
  })

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users')
        const result = await response.json()
        if (result.success) {
          setUsers(result.data.map((u: { id: string; name: string | null; email: string; role: string }) => ({
            ...u,
            role: u.role || 'USER'
          })))
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
    loadUsers()
  }, [])

  useEffect(() => {
    if (template?.id) {
      const loadAssignments = async () => {
        setLoadingAssignments(true)
        try {
          const response = await fetch(`/api/admin/wizard-assignments?templateId=${template.id}`)
          const result = await response.json()
          if (result.success) {
            setAssignments(result.data.map((a: WizardAssignment) => ({
              id: a.id,
              userId: a.userId,
              role: a.role as string | null,
              priority: a.priority,
              validFrom: null,
              validUntil: null,
              user: a.user
            })))
          }
        } catch (error) {
          console.error('Error loading assignments:', error)
        } finally {
          setLoadingAssignments(false)
        }
      }
      loadAssignments()
    }
  }, [template?.id])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.stepsConfig.findIndex((s) => s.id === active.id)
        const newIndex = prev.stepsConfig.findIndex((s) => s.id === over.id)
        const newSteps = arrayMove(prev.stepsConfig, oldIndex, newIndex)
        
        return {
          ...prev,
          stepsConfig: newSteps.map((step, index) => ({
            ...step,
            order: index,
          })),
        }
      })
    }
  }

  const generateStepId = () => `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const addStep = (stepDefinition: StepDefinitionMetadata) => {
    const newStep: WizardStepConfig = {
      id: generateStepId(),
      stepDefinitionCode: stepDefinition.code,
      order: formData.stepsConfig.length,
      isRequired: true as boolean,
      isEnabled: true as boolean,
      config: stepDefinition.configurableFields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue ?? null
        return acc
      }, {} as Record<string, unknown>),
    }

    setFormData((prev) => ({
      ...prev,
      stepsConfig: [...prev.stepsConfig, newStep],
    }))
  }

  const removeStep = (stepId: string) => {
    setFormData((prev) => ({
      ...prev,
      stepsConfig: prev.stepsConfig
        .filter((s) => s.id !== stepId)
        .map((s, index) => ({ ...s, order: index })),
    }))
  }

  const updateStep = (stepId: string, updates: Partial<WizardStepConfig>) => {
    setFormData((prev) => ({
      ...prev,
      stepsConfig: prev.stepsConfig.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    }))
  }

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.name.trim()) {
        toast.error('El nombre es requerido')
        return
      }
      if (!formData.code || !formData.code.trim()) {
        toast.error('El código es requerido')
        return
      }
      if (formData.stepsConfig.length === 0) {
        toast.error('Debes agregar al menos un paso')
        return
      }

      const url = template
        ? `/api/admin/wizard-templates/${template.id}`
        : '/api/admin/wizard-templates'
      const method = template ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const result = await response.json()
        const templateId = template?.id || result.data?.id

        if (templateId && assignments.length > 0) {
          await fetch(`/api/admin/wizard-assignments?templateId=${templateId}`, {
            method: 'DELETE',
          })

          for (const assignment of assignments) {
            await fetch('/api/admin/wizard-assignments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                templateId,
                userId: assignment.userId,
                role: assignment.role,
                priority: assignment.priority,
                validFrom: assignment.validFrom,
                validUntil: assignment.validUntil,
              }),
            })
          }
        }

        toast.success(template ? 'Wizard actualizado' : 'Wizard creado')
        onSave()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error en handleSave:', error)
      toast.error('Error al guardar wizard')
    }
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="steps">Pasos ({formData.stepsConfig.length})</TabsTrigger>
          <TabsTrigger value="assignments">Asignaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Wizard</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Wizard Estándar Puertas"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Código</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej: standard-doors"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descripción opcional del wizard"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="isActive">Wizard Activo</Label>
              <p className="text-sm text-muted-foreground">
                Los wizards inactivos no aparecen en la lista
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Label htmlFor="isDefault">Wizard por Defecto</Label>
              <p className="text-sm text-muted-foreground">
                Se usa automáticamente si no hay asignaciones
              </p>
            </div>
            <Switch
              id="isDefault"
              checked={formData.isDefault}
              onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
            />
          </div>
        </TabsContent>

        <TabsContent value="steps" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Available Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pasos Disponibles</CardTitle>
                <CardDescription>
                  Haz clic para agregar un paso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {AVAILABLE_STEP_DEFINITIONS.map((stepDef) => (
                    <div
                      key={stepDef.code}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => addStep(stepDef)}
                    >
                      <div>
                        <p className="font-medium">{stepDef.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {stepDef.description}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Configured Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pasos Configurados</CardTitle>
                <CardDescription>
                  Arrastra para reordenar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.stepsConfig.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {formData.stepsConfig.map((step, index) => {
                        const stepDef = AVAILABLE_STEP_DEFINITIONS.find(
                          (s) => s.code === step.stepDefinitionCode
                        )
                        return (
                          <SortableStepItem
                            key={step.id}
                            step={step}
                            stepDefinition={stepDef}
                            index={index}
                            onRemove={() => removeStep(step.id)}
                            onUpdate={(updates) => updateStep(step.id, updates)}
                          />
                        )
                      })}
                    </div>
                  </SortableContext>
                </DndContext>

                {formData.stepsConfig.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    Agrega pasos desde el panel izquierdo
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardContent className="p-6">
              {loadingAssignments ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Asignaciones del Wizard</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAssignments([
                          ...assignments,
                          {
                            userId: null,
                            role: null,
                            priority: 0,
                            validFrom: null,
                            validUntil: null,
                          },
                        ])
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar
                    </Button>
                  </div>

                  {assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay asignaciones configuradas. Este wizard será usado solo si es el predeterminado.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((assignment, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <div className="flex-1 grid gap-3 md:grid-cols-3">
                            <div>
                              <Label className="text-xs">Usuario</Label>
                              <Select
                                value={assignment.userId || 'all'}
                                onValueChange={(value) => {
                                  const newAssignments = [...assignments]
                                  newAssignments[index].userId = value === 'all' ? null : value
                                  setAssignments(newAssignments)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Todos los usuarios" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos los usuarios</SelectItem>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name || user.email}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Rol</Label>
                              <Select
                                value={assignment.role || 'all'}
                                onValueChange={(value) => {
                                  const newAssignments = [...assignments]
                                  newAssignments[index].role = value === 'all' ? null : value
                                  setAssignments(newAssignments)
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Todos los roles" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">Todos los roles</SelectItem>
                                  <SelectItem value="ADMIN">Admin</SelectItem>
                                  <SelectItem value="USER">Usuario</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs">Prioridad</Label>
                              <Input
                                type="number"
                                value={assignment.priority}
                                onChange={(e) => {
                                  const newAssignments = [...assignments]
                                  newAssignments[index].priority = parseInt(e.target.value) || 0
                                  setAssignments(newAssignments)
                                }}
                              />
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newAssignments = assignments.filter((_, i) => i !== index)
                              setAssignments(newAssignments)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col items-end gap-2 pt-4 border-t">
        {(!formData.name || !formData.code || formData.stepsConfig.length === 0) && (
          <p className="text-sm text-red-500">
            {!formData.name && "• Nombre requerido "}
            {!formData.code && "• Código requerido "}
            {formData.stepsConfig.length === 0 && "• Agrega al menos un paso"}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name || !formData.code || formData.stepsConfig.length === 0}
          >
            Guardar Wizard
          </Button>
        </div>
      </div>
    </div>
  )
}

// ==================== Sortable Step Item ====================

interface SortableStepItemProps {
  step: WizardStepConfig
  stepDefinition?: StepDefinitionMetadata
  index: number
  onRemove: () => void
  onUpdate: (updates: Partial<WizardStepConfig>) => void
}

function SortableStepItem({
  step,
  stepDefinition,
  index,
  onRemove,
  onUpdate,
}: SortableStepItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: step.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg ${isDragging ? 'shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          className="cursor-grab touch-none"
          {...attributes}
          {...listeners}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        
        <div className="flex-1 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {index + 1}
            </Badge>
            <span className="font-medium text-sm">
              {stepDefinition?.name || step.stepDefinitionCode}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Switch
            checked={step.isEnabled}
            onCheckedChange={(checked) => onUpdate({ isEnabled: checked })}
          />
          <Button variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      {isExpanded && stepDefinition && (
        <div className="px-3 pb-3 pt-0 border-t">
          <StepConfigForm
            step={step}
            stepDefinition={stepDefinition}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  )
}

// ==================== Step Config Form ====================

interface StepConfigFormProps {
  step: WizardStepConfig
  stepDefinition: StepDefinitionMetadata
  onUpdate: (updates: Partial<WizardStepConfig>) => void
}

function StepConfigForm({
  step,
  stepDefinition,
  onUpdate,
}: StepConfigFormProps) {
  return (
    <div className="space-y-3 pt-3">
      <h4 className="font-medium text-sm">Configuración del paso</h4>
      
      <div className="flex items-center justify-between">
        <Label className="text-xs">Paso obligatorio</Label>
        <Switch
          checked={step.isRequired}
          onCheckedChange={(checked) => onUpdate({ isRequired: checked })}
        />
      </div>

      {stepDefinition.configurableFields.length > 0 && (
        <div className="space-y-2">
          {stepDefinition.configurableFields.map((field) => (
            <div key={field.name} className="space-y-1">
              <Label className="text-xs">{field.label}</Label>
              {field.type === 'boolean' ? (
                <Switch
                  checked={(step.config[field.name] as boolean) ?? field.defaultValue ?? false}
                  onCheckedChange={(checked) => {
                    onUpdate({
                      config: {
                        ...step.config,
                        [field.name]: checked,
                      },
                    })
                  }}
                />
              ) : field.type === 'number' ? (
                <Input
                  type="number"
                  value={(step.config[field.name] as number) ?? field.defaultValue ?? ''}
                  onChange={(e) => {
                    onUpdate({
                      config: {
                        ...step.config,
                        [field.name]: parseInt(e.target.value) || 0,
                      },
                    })
                  }}
                />
              ) : field.type === 'text' ? (
                <Input
                  value={(step.config[field.name] as string) ?? field.defaultValue ?? ''}
                  onChange={(e) => {
                    onUpdate({
                      config: {
                        ...step.config,
                        [field.name]: e.target.value,
                      },
                    })
                  }}
                />
              ) : field.options ? (
                <Select
                  value={(step.config[field.name] as string) ?? ''}
                  onValueChange={(value) => {
                    onUpdate({
                      config: {
                        ...step.config,
                        [field.name]: value,
                      },
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
