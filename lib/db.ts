
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure the singleton exists in development
if (process.env.NODE_ENV !== 'production') {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = prismaClientSingleton()
  } else {
    // If it exists but is stale (missing new models), force a refresh
    const currentPrisma = globalForPrisma.prisma as any
    if (!currentPrisma.productBackFace) {
      console.log('--- FORCING PRISMA RE-INSTANTIATION (New Models Detected) ---');
      globalForPrisma.prisma = prismaClientSingleton()
    }
  }
}

// In production, we might just use a singleton directly or via global
const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Instead of just exporting a const, we ensure we are exporting the most current instance if possible
export { prisma }
