
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { 
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Download,
  RefreshCw,
  Settings,
  Check
} from 'lucide-react'
import { Quote } from '@/lib/types'
import { getStatusDisplayName } from '@/lib/utils'
import { toast } from 'sonner'

interface QuoteActionsProps {
  quote: Quote
  onDownloadPDF?: (quote: Quote) => void
  onRefresh?: () => void
  showUserInfo?: boolean
}

const QUOTE_STATUSES = [
  { key: 'DRAFT', label: 'Borrador', color: 'bg-gray-100 text-gray-800' },
  { key: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'APPROVED', label: 'Aprobada', color: 'bg-green-100 text-green-800' },
  { key: 'REJECTED', label: 'Rechazada', color: 'bg-red-100 text-red-800' },
  { key: 'EXPIRED', label: 'Expirada', color: 'bg-gray-100 text-gray-800' },
  { key: 'CONVERTED', label: 'Convertida', color: 'bg-purple-100 text-purple-800' },
]

export function QuoteActions({ 
  quote, 
  onDownloadPDF, 
  onRefresh,
  showUserInfo = false 
}: QuoteActionsProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<string>(quote.status)

  const handleDuplicate = async () => {
    setLoading('duplicate')
    try {
      const response = await fetch(`/api/quotes/${quote.id}/duplicate`, {
        method: 'POST',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Cotización duplicada exitosamente')
        router.push(`/quotes/${result.data.id}`)
      } else {
        toast.error(result.error || 'Error al duplicar cotización')
      }
    } catch (error) {
      toast.error('Error al duplicar cotización')
      console.error('Duplicate error:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleDelete = async () => {
    setLoading('delete')
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Cotización eliminada exitosamente')
        onRefresh?.()
        setDeleteDialogOpen(false)
      } else {
        toast.error(result.error || 'Error al eliminar cotización')
      }
    } catch (error) {
      toast.error('Error al eliminar cotización')
      console.error('Delete error:', error)
    } finally {
      setLoading(null)
    }
  }

  const handleStatusChange = async () => {
    if (newStatus === quote.status) {
      setStatusDialogOpen(false)
      return
    }

    setLoading('status')
    try {
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Estado cambiado a ${getStatusDisplayName(newStatus)}`)
        onRefresh?.()
        setStatusDialogOpen(false)
      } else {
        toast.error(result.error || 'Error al cambiar estado')
      }
    } catch (error) {
      toast.error('Error al cambiar estado')
      console.error('Status change error:', error)
    } finally {
      setLoading(null)
    }
  }

  // Admins can edit/delete any quote, regular users have restrictions
  const isAdmin = session?.user?.role === 'ADMIN'
  const canEdit = isAdmin || quote.status === 'DRAFT'
  const canDelete = isAdmin || ['DRAFT', 'REJECTED', 'EXPIRED'].includes(quote.status)

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/quotes/${quote.id}`)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Ver
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onDownloadPDF?.(quote)}
        >
          <Download className="w-4 h-4" />
        </Button>

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {canEdit && (
              <DropdownMenuItem
                onClick={() => router.push(`/quotes/${quote.id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem
              onClick={handleDuplicate}
              disabled={loading === 'duplicate'}
            >
              {loading === 'duplicate' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              Duplicar
            </DropdownMenuItem>

            {/* Only admins can change quote status */}
            {isAdmin && (
              <DropdownMenuItem
                onClick={() => setStatusDialogOpen(true)}
                disabled={loading === 'status'}
              >
                <Settings className="w-4 h-4 mr-2" />
                Cambiar Estado
              </DropdownMenuItem>
            )}

            {canDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={loading === 'delete'}
                  className="text-red-600 focus:text-red-600"
                >
                  {loading === 'delete' ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar cotización?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la cotización "{quote.quoteNumber}" 
              para el proyecto "{quote.projectName}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading === 'delete'}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading === 'delete'}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading === 'delete' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Dialog */}
      <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar Estado de Cotización</DialogTitle>
            <DialogDescription>
              Cambia el estado de la cotización "{quote.quoteNumber}".
              Estado actual: <Badge variant="outline">{getStatusDisplayName(quote.status)}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nuevo Estado</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {QUOTE_STATUSES.map((status) => (
                    <SelectItem key={status.key} value={status.key}>
                      <div className="flex items-center gap-2">
                        {status.label}
                        {status.key === quote.status && (
                          <Badge variant="outline" className={status.color}>
                            Actual
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStatusDialogOpen(false)}
              disabled={loading === 'status'}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={loading === 'status' || newStatus === quote.status}
            >
              {loading === 'status' ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Cambiar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
