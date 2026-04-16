
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check database connection
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running'
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }

    return NextResponse.json(healthCheck, { status: 200 })
  } catch (error) {
    console.error('Health check failed:', error)
    
    const healthCheck = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        application: 'running'
      },
      error: 'Database connection failed'
    }

    return NextResponse.json(healthCheck, { status: 503 })
  } finally {
    await prisma.$disconnect()
  }
}
