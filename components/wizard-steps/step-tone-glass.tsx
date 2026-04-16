'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

const GLASS_TONES = [
    { id: 'Natural', name: 'Natural', description: null as string | null, priceAdjustment: 0 },
    { id: 'Ahumado Claro', name: 'Ahumado Claro', description: null, priceAdjustment: 0 },
    { id: 'Bronce texturizado con 1 capa de pintura', name: 'Bronce texturizado con 1 capa de pintura', description: null, priceAdjustment: 0 },
    { id: 'Espejo bronce de 6mm', name: 'Espejo bronce de 6mm', description: null, priceAdjustment: 0 },
    { id: 'Tela encapsulada en vidrio ultraclaro de 4+4', name: 'Tela encapsulada en vidrio ultraclaro de 4+4', description: null, priceAdjustment: 0 },
    { id: 'Tela encapsulada en vidrio claro de 4+4', name: 'Tela encapsulada en vidrio claro de 4+4', description: null, priceAdjustment: 0 },
    { id: 'Espejo claro Anticado de 6mm', name: 'Espejo claro Anticado de 6mm', description: null, priceAdjustment: 0 },
    { id: 'Filtrasol Texturizado de 6mm', name: 'Filtrasol Texturizado de 6mm', description: null, priceAdjustment: 0 },
    { id: 'Vidrio claro texturizado de 6mm con pintura', name: 'Vidrio claro texturizado de 6mm con pintura', description: null, priceAdjustment: 0 },
    { id: 'Vidrio Cristazul texturizado de 6mm', name: 'Vidrio Cristazul texturizado de 6mm', description: null, priceAdjustment: 0 },
]

interface GlassTone {
    id: string
    name: string
    description: string | null
    priceAdjustment: number
}

export function StepToneGlass({ state, updateState, onNext, config }: WizardStepProps) {
    const [tones, setTones] = useState<GlassTone[]>([])
    const [loading, setLoading] = useState(true)
    const selectedTone = state.data.toneGlass as string
    const showPrices = (config.config.showPrices as boolean) || false

    useEffect(() => {
        const loadTones = async () => {
            try {
                setLoading(true)
                const lineId = state.data.lineId as string
                if (lineId) {
                    const response = await fetch(`/api/product-tones?lineId=${lineId}`)
                    const result = await response.json()
                    if (result.success && result.data.length > 0) {
                        setTones(result.data)
                        setLoading(false)
                        return
                    }
                }
            } catch (error) {
                console.error('Error loading tones:', error)
            }
            setTones(GLASS_TONES)
            setLoading(false)
        }

        loadTones()
    }, [state.data.lineId])

    const handleSelect = (tone: GlassTone) => {
        updateState({
            data: {
                ...state.data,
                toneGlass: tone.name,
                toneGlassId: tone.id,
                pricePerSquareMeter: tone.priceAdjustment || 4440,
            }
        })
        setTimeout(onNext, 300)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Tono Vidrio</h2>
                <p className="text-muted-foreground">Selecciona el tono de vidrio</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {tones.map((tone) => (
                    <Card
                        key={tone.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedTone === tone.name && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(tone)}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{tone.name}</CardTitle>
                                {selectedTone === tone.name && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            {tone.description && (
                                <CardDescription>{tone.description}</CardDescription>
                            )}
                            {showPrices && tone.priceAdjustment > 0 && (
                                <p className="text-sm font-medium text-primary mt-2">
                                    ${tone.priceAdjustment}/m²
                                </p>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
