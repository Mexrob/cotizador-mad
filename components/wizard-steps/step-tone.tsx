'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

interface ProductTone {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    hexColor: string | null
    priceAdjustment: number
}

export function StepTone({ state, updateState, onNext, config }: WizardStepProps) {
    const [tones, setTones] = useState<ProductTone[]>([])
    const [loading, setLoading] = useState(true)
    const selectedTone = state.data.tone as string
    const selectedToneId = state.data.toneId as string
    const selectedLineId = state.data.lineId as string
    const filterByLine = (config.config.filterByLine as boolean) !== false
    const showPrices = config.config.showPrices as boolean

    useEffect(() => {
        const loadTones = async () => {
            try {
                setLoading(true)
                const url = filterByLine && selectedLineId
                    ? `/api/product-lines/${selectedLineId}/tones`
                    : '/api/product-tones'
                const response = await fetch(url)
                const result = await response.json()
                if (result.success) {
                    setTones(result.data)
                }
            } catch (error) {
                console.error('Error loading tones:', error)
            } finally {
                setLoading(false)
            }
        }

        loadTones()
    }, [selectedLineId, filterByLine])

    const handleSelect = (tone: ProductTone) => {
        updateState({
            data: {
                ...state.data,
                tone: tone.name,
                toneId: tone.id,
                pricePerSquareMeter: tone.priceAdjustment
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
                <h2 className="text-2xl font-bold">Tono</h2>
                <p className="text-muted-foreground">Selecciona el tono del producto</p>
            </div>

            <div className="grid gap-4 max-w-5xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
                {tones.map((tone) => (
                    <Card
                        key={tone.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedToneId === tone.id && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(tone)}
                    >
                        {tone.imageUrl ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                                <img
                                    src={tone.imageUrl}
                                    alt={tone.name}
                                    className="object-cover w-full h-full transition-transform hover:scale-105"
                                />
                            </div>
                        ) : tone.hexColor ? (
                            <div 
                                className="aspect-video w-full rounded-t-xl"
                                style={{ backgroundColor: tone.hexColor }}
                            />
                        ) : null}
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{tone.name}</CardTitle>
                                {selectedToneId === tone.id && (
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
                                    +${tone.priceAdjustment}/m²
                                </p>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
