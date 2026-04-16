'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

interface BackFace {
    id: string
    name: string
    description: string | null
    priceAdjustment: number
    isTwoSided: boolean
}

export function StepBackFace({ state, updateState, onNext, config }: WizardStepProps) {
    const [backFaces, setBackFaces] = useState<BackFace[]>([])
    const [loading, setLoading] = useState(true)
    const selectedBackFace = state.data.backFace as string
    const allowTwoSided = (config.config.allowTwoSided as boolean) !== false

    useEffect(() => {
        const loadBackFaces = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/product-back-faces')
                const result = await response.json()
                if (result.success) {
                    const faces = result.data as BackFace[]
                    setBackFaces(allowTwoSided ? faces : faces.filter(f => !f.isTwoSided))
                }
            } catch (error) {
                console.error('Error loading back faces:', error)
            } finally {
                setLoading(false)
            }
        }

        loadBackFaces()
    }, [allowTwoSided])

    const handleSelect = (backFace: BackFace) => {
        updateState({
            data: {
                ...state.data,
                backFace: backFace.name,
                backFaceId: backFace.id,
                isTwoSided: backFace.isTwoSided
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
                <h2 className="text-2xl font-bold">Cara Trasera</h2>
                <p className="text-muted-foreground">Selecciona el tipo de cara trasera</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {backFaces.map((backFace) => (
                    <Card
                        key={backFace.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedBackFace === backFace.name && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(backFace)}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{backFace.name}</CardTitle>
                                {selectedBackFace === backFace.name && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            {backFace.description && (
                                <CardDescription>{backFace.description}</CardDescription>
                            )}
                            {backFace.priceAdjustment > 0 && (
                                <p className="text-sm font-medium text-primary mt-2">
                                    +${backFace.priceAdjustment}
                                </p>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
