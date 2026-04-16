import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ALTO_BRILLO_WIZARD_STEPS = [
  {
    id: 'alto-brillo-tone',
    stepDefinitionCode: 'tone-selection',
    order: 0,
    isRequired: true,
    isEnabled: true,
    config: {
      showPrices: false,
      filterByLine: false,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alto-brillo-dimensions',
    stepDefinitionCode: 'dimensions',
    order: 1,
    isRequired: true,
    isEnabled: true,
    config: {
      minWidth: 300,
      maxWidth: 1500,
      minHeight: 300,
      maxHeight: 2400,
      allowQuantity: true,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alto-brillo-back-face',
    stepDefinitionCode: 'back-face-selection',
    order: 2,
    isRequired: true,
    isEnabled: true,
    config: {},
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alto-brillo-edge-banding',
    stepDefinitionCode: 'edge-banding-selection',
    order: 3,
    isRequired: true,
    isEnabled: true,
    config: {},
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alto-brillo-handle',
    stepDefinitionCode: 'handle-selection',
    order: 4,
    isRequired: false,
    isEnabled: true,
    config: {
      filterByLine: false,
      required: false,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alto-brillo-optionals',
    stepDefinitionCode: 'optionals',
    order: 5,
    isRequired: false,
    isEnabled: true,
    config: {
      showExhibition: false,
      showExpress: false,
      showTwoSided: true,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alto-brillo-summary',
    stepDefinitionCode: 'summary',
    order: 6,
    isRequired: true,
    isEnabled: true,
    config: {
      showPricing: true,
      allowEdit: true,
    },
    conditions: [],
    skipConditions: [],
  },
]

const PRICING_CONFIG = {
  baseFormula: 'alto-brillo-calculation',
  adjustments: [],
  rounding: 'nearest',
  roundingPrecision: 2,
}

const UI_CONFIG = {
  theme: {
    primaryColor: '#10b981',
  },
  texts: {
    title: 'Cotizador Alto Brillo',
    description: 'Configura puertas y cajones de MDF alto brillo',
  },
  layout: {
    showProgressBar: true,
    allowBack: true,
    allowSkip: true,
  },
}

async function main() {
  console.log('Creating Alto Brillo WizardTemplate...')

  const existingTemplate = await prisma.wizardTemplate.findUnique({
    where: { code: 'alto-brillo' },
  })

  if (existingTemplate) {
    console.log('WizardTemplate "alto-brillo" already exists. Updating...')
    await prisma.wizardTemplate.update({
      where: { code: 'alto-brillo' },
      data: {
        name: 'Cotizador Alto Brillo',
        description: 'Cotizador para puertas y cajones de MDF alto brillo',
        stepsConfig: ALTO_BRILLO_WIZARD_STEPS as any,
        pricingConfig: PRICING_CONFIG as any,
        uiConfig: UI_CONFIG as any,
        isActive: true,
      },
    })
    console.log('✓ Updated WizardTemplate "alto-brillo"')
  } else {
    await prisma.wizardTemplate.create({
      data: {
        name: 'Cotizador Alto Brillo',
        description: 'Cotizador para puertas y cajones de MDF alto brillo',
        code: 'alto-brillo',
        stepsConfig: ALTO_BRILLO_WIZARD_STEPS as any,
        pricingConfig: PRICING_CONFIG as any,
        uiConfig: UI_CONFIG as any,
        isActive: true,
        isDefault: false,
      },
    })
    console.log('✓ Created WizardTemplate "alto-brillo"')
  }

  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
