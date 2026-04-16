
import { PrismaClient } from '@prisma/client'
import { compare } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@module.com.mx'
  const password = 'admin123'

  console.log(`Checking user: ${email}`)

  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    console.log('User not found!')
    return
  }

  console.log('User found:')
  console.log(`ID: ${user.id}`)
  console.log(`Email: ${user.email}`)
  console.log(`Role: ${user.role}`)
  console.log(`Status: ${user.status}`)
  console.log(`Password Hash: ${user.password?.substring(0, 10)}...`)

  if (user.password) {
    const isValid = await compare(password, user.password)
    console.log(`Password 'admin123' is valid: ${isValid}`)
  } else {
    console.log('User has no password set.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
