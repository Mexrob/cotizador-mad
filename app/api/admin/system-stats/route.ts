import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import os from 'os'
import fs from 'fs'

export const dynamic = 'force-dynamic'

function getCpuUsage(): number {
  const cpus = os.cpus()
  let totalIdle = 0
  let totalTick = 0

  cpus.forEach((cpu) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times]
    }
    totalIdle += cpu.times.idle
  })

  const idle = totalIdle / cpus.length
  const total = totalTick / cpus.length
  const usage = 100 - (100 * idle / total)

  return Math.round(usage * 10) / 10
}

function getMemoryUsage() {
  const total = os.totalmem()
  const free = os.freemem()
  const used = total - free
  const usagePercent = (used / total) * 100

  return {
    total: Math.round(total / (1024 * 1024 * 1024) * 10) / 10,
    used: Math.round(used / (1024 * 1024 * 1024) * 10) / 10,
    free: Math.round(free / (1024 * 1024 * 1024) * 10) / 10,
    usagePercent: Math.round(usagePercent * 10) / 10,
  }
}

function getUptime() {
  const uptime = os.uptime()
  const days = Math.floor(uptime / 86400)
  const hours = Math.floor((uptime % 86400) / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  return { days, hours, minutes, totalSeconds: uptime }
}

function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    hostname: os.hostname(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown',
  }
}

function getDiskUsage() {
  try {
    const stats = fs.statfsSync('/')
    const total = stats.bsize * stats.blocks
    const free = stats.bsize * stats.bfree
    const used = total - free
    const usagePercent = (used / total) * 100

    return {
      total: Math.round(total / (1024 * 1024 * 1024) * 10) / 10,
      used: Math.round(used / (1024 * 1024 * 1024) * 10) / 10,
      free: Math.round(free / (1024 * 1024 * 1024) * 10) / 10,
      usagePercent: Math.round(usagePercent * 10) / 10,
    }
  } catch (error) {
    console.error('Error getting disk usage:', error)
    return {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0,
    }
  }
}

function getCPUTemperature(): number | null {
  try {
    const thermalDirs = '/sys/class/thermal'
    if (!fs.existsSync(thermalDirs)) return null

    const zones = fs.readdirSync(thermalDirs).filter(d => d.startsWith('thermal_zone'))
    
    for (const zone of zones) {
      const tempPath = `${thermalDirs}/${zone}/temp`
      if (fs.existsSync(tempPath)) {
        const temp = parseInt(fs.readFileSync(tempPath, 'utf8').trim())
        if (temp > 0) {
          return Math.round(temp / 1000 * 10) / 10
        }
      }
    }
    return null
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso restringido a administradores' },
        { status: 403 }
      )
    }

    const systemStats = {
      cpu: getCpuUsage(),
      memory: getMemoryUsage(),
      disk: getDiskUsage(),
      uptime: getUptime(),
      system: getSystemInfo(),
      temperature: getCPUTemperature(),
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: systemStats,
    })
  } catch (error) {
    console.error('System stats error:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del sistema' },
      { status: 500 }
    )
  }
}
