
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  DollarSign,
  Search,
  RotateCcw,
  SlidersHorizontal
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export interface AdvancedFilters {
  search?: string
  statuses?: string[]
  customerName?: string
  projectName?: string
  quoteNumber?: string
  minAmount?: number
  maxAmount?: number
  startDate?: Date
  endDate?: Date
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface AdvancedFiltersProps {
  filters: AdvancedFilters
  onFiltersChange: (filters: AdvancedFilters) => void
  onClearFilters: () => void
  statusCounts?: Record<string, number>
}

const QUOTE_STATUSES = [
  { key: 'DRAFT', label: 'Borrador', color: 'bg-blue-100 text-blue-800' },
  { key: 'PENDING', label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'APPROVED', label: 'Aprobada', color: 'bg-green-100 text-green-800' },
  { key: 'REJECTED', label: 'Rechazada', color: 'bg-red-100 text-red-800' },
  { key: 'EXPIRED', label: 'Expirada', color: 'bg-gray-100 text-gray-800' },
  { key: 'CONVERTED', label: 'Convertida', color: 'bg-purple-100 text-purple-800' },
]

const SORT_OPTIONS = [
  { key: 'createdAt', label: 'Fecha de creación' },
  { key: 'customerName', label: 'Nombre del cliente' },
  { key: 'projectName', label: 'Nombre del proyecto' },
  { key: 'totalAmount', label: 'Monto total' },
  { key: 'status', label: 'Estado' },
  { key: 'validUntil', label: 'Válida hasta' },
]

export function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  statusCounts = {}
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)

  const updateFilter = useCallback((field: keyof AdvancedFilters, value: any) => {
    onFiltersChange({ ...filters, [field]: value })
  }, [filters, onFiltersChange])

  const toggleStatus = useCallback((status: string) => {
    const currentStatuses = filters.statuses || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status]
    updateFilter('statuses', newStatuses)
  }, [filters.statuses, updateFilter])

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof AdvancedFilters]
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== '' && value !== null
  })

  const activeFilterCount = [
    filters.search,
    filters.statuses?.length,
    filters.customerName,
    filters.projectName,
    filters.quoteNumber,
    filters.minAmount,
    filters.maxAmount,
    filters.startDate,
    filters.endDate,
  ].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* Quick Status Filters */}
      <div className="flex flex-wrap gap-2">
        {QUOTE_STATUSES.map((status) => {
          const isActive = filters.statuses?.includes(status.key)
          const count = statusCounts[status.key] || 0
          return (
            <Button
              key={status.key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleStatus(status.key)}
              className="flex items-center gap-2"
            >
              {status.label}
              <Badge variant="secondary" className={status.color}>
                {count}
              </Badge>
            </Button>
          )
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Buscar por cliente, proyecto, número de cotización..."
          value={filters.search || ''}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10 py-3 text-lg"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros Avanzados
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="flex items-center gap-2 text-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar Filtros
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros Avanzados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Specific Field Searches */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Nombre del Cliente</Label>
                    <Input
                      id="customerName"
                      placeholder="Buscar cliente..."
                      value={filters.customerName || ''}
                      onChange={(e) => updateFilter('customerName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Nombre del Proyecto</Label>
                    <Input
                      id="projectName"
                      placeholder="Buscar proyecto..."
                      value={filters.projectName || ''}
                      onChange={(e) => updateFilter('projectName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quoteNumber">Número de Cotización</Label>
                    <Input
                      id="quoteNumber"
                      placeholder="Buscar número..."
                      value={filters.quoteNumber || ''}
                      onChange={(e) => updateFilter('quoteNumber', e.target.value)}
                    />
                  </div>
                </div>

                {/* Amount Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Rango de Monto
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minAmount" className="text-sm text-gray-600">
                        Monto mínimo
                      </Label>
                      <Input
                        id="minAmount"
                        type="number"
                        placeholder="0"
                        value={filters.minAmount || ''}
                        onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxAmount" className="text-sm text-gray-600">
                        Monto máximo
                      </Label>
                      <Input
                        id="maxAmount"
                        type="number"
                        placeholder="Sin límite"
                        value={filters.maxAmount || ''}
                        onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </div>
                  </div>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Rango de Fechas
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Fecha de inicio</Label>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.startDate ? (
                              format(filters.startDate, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.startDate}
                            onSelect={(date) => {
                              updateFilter('startDate', date)
                              setStartDateOpen(false)
                            }}
                            disabled={(date) =>
                              date > new Date() || (filters.endDate ? date >= filters.endDate : false)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Fecha de fin</Label>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {filters.endDate ? (
                              format(filters.endDate, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={filters.endDate}
                            onSelect={(date) => {
                              updateFilter('endDate', date)
                              setEndDateOpen(false)
                            }}
                            disabled={(date) =>
                              date > new Date() || (filters.startDate ? date <= filters.startDate : false)
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Sort Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sortBy">Ordenar por</Label>
                    <Select
                      value={filters.sortBy || 'createdAt'}
                      onValueChange={(value) => updateFilter('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar campo" />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((option) => (
                          <SelectItem key={option.key} value={option.key}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sortOrder">Orden</Label>
                    <Select
                      value={filters.sortOrder || 'desc'}
                      onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar orden" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descendente</SelectItem>
                        <SelectItem value="asc">Ascendente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
