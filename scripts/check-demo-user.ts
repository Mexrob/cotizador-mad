
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { email: 'demo@module.com.mx' }
  })
  
  if (user) {
    console.log('✅ Usuario encontrado:')
    console.log('Email:', user.email)
    console.log('Rol:', user.role)
    console.log('Status:', user.status)
    console.log('Has Password:', !!user.password)
  } else {
    console.log('❌ Usuario NO encontrado')
  }
}

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
