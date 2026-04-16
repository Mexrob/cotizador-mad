
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function simulateLogin() {
  const email = 'demo@module.com.mx'
  const password = 'demo1234'
  
  console.log('🔍 [Simulate] Intentando login para:', email)
  
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user) {
    console.log('❌ [Simulate] Usuario no encontrado')
    return
  }
  
  console.log('✅ [Simulate] Usuario encontrado. Rol:', user.role)
  
  if (!user.password) {
    console.log('❌ [Simulate] Usuario no tiene contraseña')
    return
  }
  
  const isValid = await compare(password, user.password)
  console.log('🔐 [Simulate] ¿Contraseña válida?:', isValid)
  
  if (isValid) {
    console.log('🎉 [Simulate] Login exitoso en simulación')
  } else {
    console.log('❌ [Simulate] Login fallido en simulación')
  }
}

simulateLogin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
