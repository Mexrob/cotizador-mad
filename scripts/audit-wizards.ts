
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function auditWizardTemplates() {
  try {
    console.log('--- Iniciando Auditoría de WizardTemplates ---')

    const templates = await prisma.wizardTemplate.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        stepsConfig: true,
      }
    })

    console.log(`Total de plantillas encontradas: ${templates.length}`)

    const seenConfigs = new Map()
    const duplicates: { template1: any, template2: any }[] = []

    for (const t of templates) {
      // Serializamos el JSON para comparar contenido
      const configStr = JSON.stringify(t.stepsConfig)
      
      if (seenConfigs.has(configStr)) {
        duplicates.push({
          template1: seenConfigs.get(configStr),
          template2: t
        })
      } else {
        seenConfigs.set(configStr, t)
      }
    }

    if (duplicates.length > 0) {
      console.warn('⚠️ Se encontraron plantillas con configuraciones de pasos idénticas (posible duplicidad):')
      duplicates.forEach((d, i) => {
        console.log(`${i + 1}. "${d.template1.name}" (code: ${d.template1.code}) y "${d.template2.name}" (code: ${d.template2.code})`)
      })
    } else {
      console.log('✅ No se encontraron configuraciones de pasos duplicadas.')
    }

    // Verificar asignaciones múltiples
    const assignments = await prisma.wizardAssignment.findMany({
      include: { template: true }
    })

    const roleAssignments = assignments.filter(a => a.role)
    console.log(`Total de asignaciones por rol: ${roleAssignments.length}`)

    // Agrupar por rol
    const roles = Array.from(new Set(roleAssignments.map(a => a.role)))
    roles.forEach(role => {
      const assignedTemplates = roleAssignments.filter(a => a.role === role)
      if (assignedTemplates.length > 1) {
        console.warn(`⚠️ El rol "${role}" tiene asignadas múltiples plantillas: ${assignedTemplates.map(a => a.template.name).join(', ')}`)
      }
    })

  } catch (error) {
    console.error('Error durante la auditoría:', error)
  } finally {
    await prisma.$disconnect()
  }
}

auditWizardTemplates()
