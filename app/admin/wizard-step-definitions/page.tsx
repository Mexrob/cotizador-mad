import { WizardStepDefinitionsAdmin } from '@/components/wizard-admin/wizard-step-definitions-admin'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Definiciones de Pasos | Admin',
  description: 'Gestiona los tipos de pasos disponibles para los wizards',
}

export default function WizardStepDefinitionsPage() {
  return (
    <div className="container mx-auto py-8">
      <WizardStepDefinitionsAdmin />
    </div>
  )
}
