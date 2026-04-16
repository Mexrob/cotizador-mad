
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function isolateTemplate() {
  try {
    const template = await prisma.wizardTemplate.findUnique({
      where: { code: '004-copy' }
    })

    if (!template) {
      console.error('Plantilla 004-copy no encontrada')
      return
    }

    const newStepsConfig = (template.stepsConfig as any[]).map(step => ({
      ...step,
      id: `step-${Date.now()}-${randomUUID().slice(0, 8)}`
    }))

    await prisma.wizardTemplate.update({
      where: { id: template.id },
      data: { stepsConfig: newStepsConfig }
    })

    console.log('✅ IDs de pasos regenerados con éxito para 004-copy')
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

isolateTemplate()
