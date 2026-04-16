import { WizardAdminPanel } from '@/components/wizard-admin/wizard-admin-panel'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración de Wizards | Admin',
  description: 'Gestiona los wizards de cotización personalizables',
}

export default async function WizardAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <WizardAdminPanel />
    </div>
  )
}
