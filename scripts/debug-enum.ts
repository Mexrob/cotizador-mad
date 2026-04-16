
import { UserRole } from '@prisma/client'

async function debugPrismaEnum() {
  console.log('🔍 [Debug] Valores de UserRole en Prisma Client:')
  console.log(Object.values(UserRole))
  
  if (Object.values(UserRole).includes('DEMO' as any)) {
    console.log('✅ DEMO está presente en el enum')
  } else {
    console.log('❌ DEMO NO está presente en el enum')
  }
}

debugPrismaEnum().catch(console.error)
