'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

const ALUMINUM_TONES = [
    { name: 'Natural', description: 'Aluminio natural' },
    { name: 'Negro', description: 'Aluminio negro' },
    { name: 'Champagne', description: 'Aluminio champagne' },
]

interface AluminumTone {
    name: string
    description?: string
}

export function StepToneAluminum({ state, updateState, onNext, config }: WizardStepProps) {
    const selectedTone = state.data.toneAluminum as string
    const availableTones = ALUMINUM_TONES

    const handleSelect = (tone: AluminumTone) => {
        updateState({
            data: {
                ...state.data,
                toneAluminum: tone.name,
            }
        })
        setTimeout(onNext, 300)
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Tono Aluminio</h2>
                <p className="text-muted-foreground">Selecciona el tono de aluminio</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {availableTones.map((tone) => (
                    <Card
                        key={tone.name}
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
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
