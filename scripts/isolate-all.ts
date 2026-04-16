
import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

async function auditAndIsolateAll() {
  try {
    console.log('--- Iniciando Auditoría y Aislamiento Masivo ---')

    const templates = await prisma.wizardTemplate.findMany({
      orderBy: { code: 'asc' }
    })

    const configMap = new Map<string, string[]>() // key: JSON.stringify(config), value: array of template names

    for (const t of templates) {
      const configKey = JSON.stringify(t.stepsConfig)
      const current = configMap.get(configKey) || []
      current.push(t.name)
      configMap.set(configKey, current)
    }

    const duplicates = Array.from(configMap.entries()).filter(([_, names]) => names.length > 1)

    if (duplicates.length > 0) {
      console.warn('⚠️ Se encontraron grupos de plantillas con configuraciones idénticas:')
      for (const [config, names] of duplicates) {
        console.log(`Grupo: [${names.join(', ')}]`)
        
        // Aislar todas menos la primera del grupo
        for (let i = 1; i < names.length; i++) {
          const nameToIsolate = names[i]
          const template = templates.find(t => t.name === nameToIsolate)
          if (template) {
            console.log(`-> Regenerando IDs para aislar: ${nameToIsolate}`)
            const newStepsConfig = (template.stepsConfig as any[]).map(step => ({
              ...step,
              id: `iso-${Date.now()}-${randomUUID().slice(0, 8)}`
            }))
            await prisma.wizardTemplate.update({
              where: { id: template.id },
              data: { stepsConfig: newStepsConfig }
            })
          }
        }
      }
      console.log('✅ Aislamiento masivo completado.')
    } else {
      console.log('✅ Todas las plantillas ya tienen configuraciones únicas.')
    }

  } catch (error) {
    console.error('Error durante la auditoría masiva:', error)
  } finally {
    await prisma.$disconnect()
  }
}

auditAndIsolateAll()
