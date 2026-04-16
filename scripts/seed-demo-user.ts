
import { PrismaClient, UserRole, UserStatus } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 [Seed] Creando usuario demo...')

  const hashedPassword = await hash('demo1234', 12)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@module.com.mx' },
    update: {
      role: UserRole.DEMO,
      status: UserStatus.ACTIVE,
      password: hashedPassword,
    },
    create: {
      email: 'demo@module.com.mx',
      name: 'Usuario Demo',
      password: hashedPassword,
      role: UserRole.DEMO,
      status: UserStatus.ACTIVE,
      companyName: 'Module al Dente (Demo)',
    },
  })

  console.log('✅ [Seed] Usuario demo creado/actualizado:', demoUser.email)
}

main()
  .catch((e) => {
    console.error('❌ [Seed] Error creando usuario demo:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
