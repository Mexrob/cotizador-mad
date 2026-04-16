
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function compareTemplates() {
  try {
    const templates = await prisma.wizardTemplate.findMany({
      where: {
        code: { in: ['004', '004-copy'] }
      }
    })

    console.log('--- Comparación de Plantillas ---')
    templates.forEach(t => {
      console.log(`\nTemplate: ${t.name} (Code: ${t.code})`)
      console.log('StepsConfig:', JSON.stringify(t.stepsConfig, null, 2))
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

compareTemplates()
