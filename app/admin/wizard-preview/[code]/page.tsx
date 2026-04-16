'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ConfigurableWizard } from '@/components/configurable-wizard'
import { WizardState } from '@/lib/wizard-configurable/types'
import { toast } from 'sonner'

export default function WizardPreviewPage() {
  const params = useParams()
  const code = params.code as string
  const [quoteId, setQuoteId] = useState<string>()

  useEffect(() => {
    // Crear una cotización temporal para preview
    const createPreviewQuote = async () => {
      try {
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: 'Preview Client',
            customerEmail: 'preview@example.com',
            projectName: 'Wizard Preview',
            validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          }),
        })
        const result = await response.json()
        if (result.success) {
          setQuoteId(result.data.id)
        }
      } catch (error) {
        console.error('Error creating preview quote:', error)
      }
    }

    createPreviewQuote()
  }, [])

  const handleComplete = async (data: WizardState['data'], pricing: WizardState['pricing']) => {
    console.log('Preview completed:', { data, pricing })
    toast.success('Wizard completado exitosamente (Preview)')
    toast.info(`Subtotal: $${pricing.subtotal.toFixed(2)}`, { duration: 5000 })
    toast.info(`Total: $${pricing.total.toFixed(2)}`, { duration: 5000 })
  }

  if (!quoteId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Modo Preview:</strong> Estás viendo una vista previa del wizard. 
          Los cambios no se guardarán permanentemente.
        </p>
      </div>
      <ConfigurableWizard
        templateCode={code}
        quoteId={quoteId}
        onComplete={handleComplete}
        onCancel={() => window.close()}
      />
    </div>
  )
}
