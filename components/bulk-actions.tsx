
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { 
  Trash2, 
  Download, 
  RefreshCw,
  CheckSquare,
  Square,
  X,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

interface BulkActionsProps {
  selectedIds: string[]
  totalCount: number
  onSelectAll: (checked: boolean) => void
  onClearSelection: () => void
  onBulkAction: (action: string, data?: any) => Promise<void>
  disabled?: boolean
}

const QUOTE_STATUSES = [
  { key: 'DRAFT', label: 'Borrador' },
  { key: 'PENDING', label: 'Pendiente' },
  { key: 'APPROVED', label: 'Aprobada' },
  { key: 'REJECTED', label: 'Rechazada' },
  { key: 'EXPIRED', label: 'Expirada' },
]

export function BulkActions({
  selectedIds,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkAction,
  disabled = false
}: BulkActionsProps) {
  const { data: session } = useSession()
  const [isExpanded, setIsExpanded] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [loading, setLoading] = useState<string | null>(null)

  const isAdmin = session?.user?.role === 'ADMIN'

  const isAllSelected = selectedIds.length === totalCount && totalCount > 0
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < totalCount

  const handleBulkAction = async (action: string, data?: any) => {
    if (disabled || selectedIds.length === 0) return

    setLoading(action)
    try {
      await onBulkAction(action, data)
      toast.success(`Acción "${action}" ejecutada exitosamente`)
      onClearSelection()
    } catch (error) {
      toast.error(`Error al ejecutar acción: ${error}`)
    } finally {
      setLoading(null)
    }
  }

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Selecciona un estado')
      return
    }
    await handleBulkAction('change_status', { status: newStatus })
    setNewStatus('')
  }

  if (selectedIds.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
      >
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Selection Info */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onSelectAll}
                    className={isSomeSelected ? "data-[state=checked]:bg-blue-500" : ""}
                  />
                  {isSomeSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-sm" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium">
                  {selectedIds.length} cotización{selectedIds.length !== 1 ? 'es' : ''} seleccionada{selectedIds.length !== 1 ? 's' : ''}
                </span>
                <Badge variant="outline">{selectedIds.length}</Badge>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={disabled || loading === 'delete'}
                      className="text-red-600 hover:text-red-700"
                    >
                      {loading === 'delete' ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar cotizaciones?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente {selectedIds.length} cotización{selectedIds.length !== 1 ? 'es' : ''}. 
                        Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBulkAction('delete')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  disabled={disabled || loading === 'export'}
                >
                  {loading === 'export' ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>

                {/* Only show expanded actions button if user has admin privileges */}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Expanded Actions - Only for admins */}
            <AnimatePresence>
              {isExpanded && isAdmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium">
                      Cambiar estado:
                    </div>
                    <Select
                      value={newStatus}
                      onValueChange={setNewStatus}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {QUOTE_STATUSES.map((status) => (
                          <SelectItem key={status.key} value={status.key}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={handleStatusChange}
                      disabled={!newStatus || disabled || loading === 'change_status'}
                    >
                      {loading === 'change_status' ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Aplicar
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
