
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
    if (!currentPrisma.productBackFace || !currentPrisma.quoteItem) {
      console.log('--- FORCING PRISMA RE-INSTANTIATION (New Models Detected) ---');
      globalForPrisma.prisma = prismaClientSingleton()
    } else {
      // Check if quoteItem has jaladera field
      try {
        const prismaSchema = currentPrisma._engine?.config?.datamodel
        if (!prismaSchema || !prismaSchema.includes('jaladera') || !prismaSchema.includes('status')) {
          console.log('--- FORCING PRISMA RE-INSTANTIATION (New Fields Detected: status) ---');
          globalForPrisma.prisma = prismaClientSingleton()
        }
      } catch (e) {
        // Engine might not be available, skip check
      }
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
