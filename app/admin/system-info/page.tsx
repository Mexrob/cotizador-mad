'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Thermometer,
  Clock,
  Monitor,
  RefreshCw,
  Activity,
  Network
} from 'lucide-react'

interface SystemStats {
  cpu: number
  memory: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  disk: {
    total: number
    used: number
    free: number
    usagePercent: number
  }
  uptime: {
    days: number
    hours: number
    minutes: number
    totalSeconds: number
  }
  system: {
    platform: string
    arch: string
    nodeVersion: string
    hostname: string
    cpuCount: number
    cpuModel: string
  }
  temperature: number | null
  timestamp: string
}

export default function SystemInfoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [refreshing, setRefreshing] = useState(false)

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

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStats(data.data)
        }
      }
    } catch (error) {
      console.error('Error fetching system stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchStats()
      const interval = setInterval(fetchStats, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchStats()
  }

  const formatUptime = (uptime: SystemStats['uptime']) => {
    const parts = []
    if (uptime.days > 0) parts.push(`${uptime.days}d`)
    if (uptime.hours > 0) parts.push(`${uptime.hours}h`)
    if (uptime.minutes > 0) parts.push(`${uptime.minutes}m`)
    return parts.join(' ') || '0m'
  }

  const getUsageColor = (percent: number) => {
    if (percent < 50) return 'bg-green-500'
    if (percent < 80) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-module-black mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando información del sistema...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <Server className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Información del Sistema</h1>
                <p className="text-muted-foreground">Monitoreo de hardware y recursos del VPS</p>
              </div>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </Button>
          </div>

          {stats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Cpu className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">CPU</p>
                          <p className="text-2xl font-bold text-foreground">{stats.cpu}%</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={stats.cpu} className="mt-4" />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MemoryStick className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Memoria</p>
                          <p className="text-2xl font-bold text-foreground">{stats.memory.usagePercent}%</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={stats.memory.usagePercent} className="mt-4" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats.memory.used} GB / {stats.memory.total} GB
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <HardDrive className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Disco</p>
                          <p className="text-2xl font-bold text-foreground">{stats.disk.usagePercent}%</p>
                        </div>
                      </div>
                    </div>
                    <Progress value={stats.disk.usagePercent} className="mt-4" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {stats.disk.used} GB / {stats.disk.total} GB
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Clock className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Uptime</p>
                          <p className="text-2xl font-bold text-foreground">{formatUptime(stats.uptime)}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      {stats.uptime.days} días, {stats.uptime.hours} horas, {stats.uptime.minutes} minutos
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Monitor className="w-5 h-5" />
                      <span>Información del Servidor</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Hostname</span>
                      <span className="font-medium">{stats.system.hostname}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Plataforma</span>
                      <span className="font-medium">{stats.system.platform}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Arquitectura</span>
                      <span className="font-medium">{stats.system.arch}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Procesadores</span>
                      <span className="font-medium">{stats.system.cpuCount} núcleos</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-muted-foreground">Modelo CPU</span>
                      <span className="font-medium text-sm">{stats.system.cpuModel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-muted-foreground">Node.js</span>
                      <span className="font-medium">{stats.system.nodeVersion}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Recursos en Tiempo Real</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Uso de CPU</span>
                        <span className="text-sm text-muted-foreground">{stats.cpu}%</span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUsageColor(stats.cpu)} transition-all duration-500`}
                          style={{ width: `${stats.cpu}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Uso de Memoria</span>
                        <span className="text-sm text-muted-foreground">
                          {stats.memory.used} GB / {stats.memory.total} GB
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUsageColor(stats.memory.usagePercent)} transition-all duration-500`}
                          style={{ width: `${stats.memory.usagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Uso de Disco</span>
                        <span className="text-sm text-muted-foreground">
                          {stats.disk.used} GB / {stats.disk.total} GB
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getUsageColor(stats.disk.usagePercent)} transition-all duration-500`}
                          style={{ width: `${stats.disk.usagePercent}%` }}
                        />
                      </div>
                    </div>

                    {stats.temperature !== null && (
                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Thermometer className="w-5 h-5 text-red-500" />
                          <span className="font-medium">Temperatura</span>
                        </div>
                        <span className="text-lg font-bold text-red-600">{stats.temperature}°C</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">Última actualización</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(stats.timestamp).toLocaleTimeString('es-MX')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Network className="w-5 h-5" />
                    <span>Detalles de Uso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <MemoryStick className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">Memoria RAM</span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usada</span>
                          <span className="font-medium">{stats.memory.used} GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Libre</span>
                          <span className="font-medium">{stats.memory.free} GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-medium">{stats.memory.total} GB</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <HardDrive className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">Almacenamiento</span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Usado</span>
                          <span className="font-medium">{stats.disk.used} GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Libre</span>
                          <span className="font-medium">{stats.disk.free} GB</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-medium">{stats.disk.total} GB</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Cpu className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">Procesador</span>
                      </div>
                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Núcleos</span>
                          <span className="font-medium">{stats.system.cpuCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Uso actual</span>
                          <span className="font-medium">{stats.cpu}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Modelo</span>
                          <span className="font-medium text-xs truncate max-w-[150px]">
                            {stats.system.cpuModel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
