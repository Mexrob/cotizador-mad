import { PrismaClient, WizardStepType } from '@prisma/client'

const prisma = new PrismaClient()

const WIZARD_STEPS = [
  {
    code: 'category-selection',
    name: 'Selección de Categoría',
    description: 'Permite al usuario seleccionar la categoría del producto',
    componentName: 'StepCategory',
    componentPath: '@/components/wizard-steps/step-category',
    icon: 'LayoutGrid',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'line-selection',
    name: 'Selección de Línea',
    description: 'Selección de la línea de producto',
    componentName: 'StepLine',
    componentPath: '@/components/wizard-steps/step-line',
    icon: 'Layers',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'product-selection',
    name: 'Selección de Productos',
    description: 'Permite seleccionar productos del catálogo',
    componentName: 'StepProduct',
    componentPath: '@/components/wizard-steps/step-product',
    icon: 'Package',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'dimensions',
    name: 'Dimensiones',
    description: 'Configuración de dimensiones del producto',
    componentName: 'StepDimensions',
    componentPath: '@/components/wizard-steps/step-dimensions',
    icon: 'Ruler',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'tone-selection',
    name: 'Selección de Tono',
    description: 'Selección del tono/color del producto',
    componentName: 'StepTone',
    componentPath: '@/components/wizard-steps/step-tone',
    icon: 'Palette',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'grain-selection',
    name: 'Dirección de Veta',
    description: 'Selección de la dirección de la veta (horizontal/vertical)',
    componentName: 'StepGrain',
    componentPath: '@/components/wizard-steps/step-grain',
    icon: 'ArrowUpDown',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'back-face-selection',
    name: 'Cara Trasera',
    description: 'Selección del tipo de cara trasera',
    componentName: 'StepBackFace',
    componentPath: '@/components/wizard-steps/step-back-face',
    icon: 'Square',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'edge-banding-selection',
    name: 'Cubrecanto',
    description: 'Selección del tipo de cubrecanto',
    componentName: 'StepEdgeBanding',
    componentPath: '@/components/wizard-steps/step-edge-banding',
    icon: 'Combine',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'handle-selection',
    name: 'Jaladera',
    description: 'Selección del modelo de jaladera',
    componentName: 'StepHandle',
    componentPath: '@/components/wizard-steps/step-handle',
    icon: 'GripHorizontal',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'optionals',
    name: 'Opcionales',
    description: 'Configuración de opciones adicionales',
    componentName: 'StepOptionals',
    componentPath: '@/components/wizard-steps/step-optionals',
    icon: 'Settings',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'summary',
    name: 'Resumen',
    description: 'Resumen final antes de guardar',
    componentName: 'StepSummary',
    componentPath: '@/components/wizard-steps/step-summary',
    icon: 'FileText',
    isSystem: true,
    stepType: 'STANDARD' as WizardStepType,
  },
  {
    code: 'custom',
    name: 'Paso Personalizado',
    description: 'Paso completamente personalizable',
    componentName: 'StepCustom',
    componentPath: '@/components/wizard-steps/step-custom',
    icon: 'Wand2',
    isSystem: true,
    stepType: 'CUSTOM' as WizardStepType,
  },
]

async function main() {
  console.log('Seeding wizard step definitions...')

  for (const step of WIZARD_STEPS) {
    await prisma.wizardStepDefinition.upsert({
      where: { code: step.code },
      update: {
        name: step.name,
        description: step.description,
        componentName: step.componentName,
        componentPath: step.componentPath,
        icon: step.icon,
        isSystem: step.isSystem,
        stepType: step.stepType,
      },
      create: step,
    })
    console.log(`✓ Synchronized: ${step.code}`)
  }

  console.log('Done!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })