import { prisma } from '@/lib/db'
import { AVAILABLE_STEP_DEFINITIONS, StepDefinitionMetadata, StepComponentType } from '@/lib/wizard-configurable/types'

export async function getStepDefinitionsFromDb() {
  const systemSteps = AVAILABLE_STEP_DEFINITIONS

  try {
    const dbSteps = await prisma.wizardStepDefinition.findMany({
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    })

    const dbStepsMetadata: StepDefinitionMetadata[] = dbSteps.map((step) => ({
      code: step.code as StepComponentType,
      name: step.name,
      description: step.description || '',
      icon: step.icon || 'Settings',
      category: step.isSystem ? 'system' : 'custom',
      configurableFields: [],
      outputs: [],
    }))

    const dbStepCodes = new Set(dbStepsMetadata.map((s) => s.code))
    const filteredSystemSteps = systemSteps.filter((s) => !dbStepCodes.has(s.code))

    return [...dbStepsMetadata, ...filteredSystemSteps]
  } catch (error) {
    console.error('Error fetching step definitions from DB:', error)
    return systemSteps
  }
}
