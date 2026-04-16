
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function verifyDemoPassword() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@module.com.mx' }
  })
  
  if (!user || !user.password) {
    console.log('❌ Usuario o contraseña no encontrados en DB')
    return
  }
  
  const isValid = await compare('demo1234', user.password)
  console.log('🔍 [Debug] ¿Contraseña demo1234 es válida?:', isValid)
  console.log('Hash en DB:', user.password)
}

verifyDemoPassword()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
