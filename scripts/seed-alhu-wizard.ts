import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ALHU_WIZARD_STEPS = [
  {
    id: 'alhú-category',
    stepDefinitionCode: 'category-selection',
    order: 0,
    isRequired: true,
    isEnabled: true,
    config: {
      categories: [
        { label: 'Puertas', value: 'doors' },
        { label: 'Cajones', value: 'drawers' },
      ],
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-line',
    stepDefinitionCode: 'line-selection',
    order: 1,
    isRequired: true,
    isEnabled: true,
    config: {
      filterByCategory: true,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-dimensions',
    stepDefinitionCode: 'dimensions',
    order: 2,
    isRequired: true,
    isEnabled: true,
    config: {
      minWidth: 300,
      maxWidth: 1500,
      minHeight: 500,
      maxHeight: 2400,
      allowQuantity: true,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-tone-glass',
    stepDefinitionCode: 'tone-glass-selection',
    order: 3,
    isRequired: true,
    isEnabled: true,
    config: {
      showPrices: false,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-tone-aluminum',
    stepDefinitionCode: 'tone-aluminum-selection',
    order: 4,
    isRequired: true,
    isEnabled: true,
    config: {
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-handle',
    stepDefinitionCode: 'handle-selection',
    order: 5,
    isRequired: false,
    isEnabled: true,
    config: {
      filterByLine: true,
      required: false,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-optionals',
    stepDefinitionCode: 'optionals',
    order: 6,
    isRequired: false,
    isEnabled: true,
    config: {
      showExhibition: true,
      showExpress: true,
      showTwoSided: false,
    },
    conditions: [],
    skipConditions: [],
  },
  {
    id: 'alhú-summary',
    stepDefinitionCode: 'summary',
    order: 7,
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
  baseFormula: 'alhu-calculation',
  adjustments: [
    {
      name: 'Exhibición',
      formula: 'subtotal * -0.10',
      applyTo: 'subtotal',
    },
  ],
  rounding: 'nearest',
  roundingPrecision: 2,
}

const UI_CONFIG = {
  theme: {
    primaryColor: '#3b82f6',
  },
  texts: {
    title: 'Cotizador Alhú',
    description: 'Configura tu puerta de aluminio y vidrio',
  },
  layout: {
    showProgressBar: true,
    allowBack: true,
    allowSkip: true,
  },
}

async function main() {
  console.log('Creating Alhú WizardTemplate...')

  const existingTemplate = await prisma.wizardTemplate.findUnique({
    where: { code: 'alhú' },
  })

  if (existingTemplate) {
    console.log('WizardTemplate "alhú" already exists. Updating...')
    await prisma.wizardTemplate.update({
      where: { code: 'alhú' },
      data: {
        name: 'Cotizador Alhú',
        description: 'Cotizador para puertas de perfiles de aluminio y vidrio',
        stepsConfig: ALHU_WIZARD_STEPS as any,
        pricingConfig: PRICING_CONFIG as any,
        uiConfig: UI_CONFIG as any,
        isActive: true,
      },
    })
    console.log('✓ Updated WizardTemplate "alhú"')
  } else {
    await prisma.wizardTemplate.create({
      data: {
        name: 'Cotizador Alhú',
        description: 'Cotizador para puertas de perfiles de aluminio y vidrio',
        code: 'alhú',
        stepsConfig: ALHU_WIZARD_STEPS as any,
        pricingConfig: PRICING_CONFIG as any,
        uiConfig: UI_CONFIG as any,
        isActive: true,
        isDefault: false,
      },
    })
    console.log('✓ Created WizardTemplate "alhú"')
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
