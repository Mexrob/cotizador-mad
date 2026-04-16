import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const template = await prisma.wizardTemplate.findUnique({
    where: { code: 'alhú' },
  })
  
  console.log(JSON.stringify(template?.stepsConfig, null, 2))
}

main()
  .finally(() => prisma.$disconnect())
