'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { StepProps, BackFace } from '../types'

const BACK_FACE_OPTIONS: { value: BackFace; label: string; description: string }[] = [
    {
        value: 'Blanca',
        label: 'Blanca',
        description: 'Cara trasera con acabado blanco estándar',
    },
    {
        value: 'Especialidad',
        label: 'Especialidad',
        description: 'Cara trasera con acabado especial personalizado',
    },
]

export default function StepBackFace({ state, updateState }: StepProps) {
    const handleSelect = (backFace: BackFace) => {
        updateState({ backFace })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 6: Cara Trasera</h2>
                <p className="text-muted-foreground">Selecciona el acabado de la cara trasera</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {BACK_FACE_OPTIONS.map((option) => (
                        <Card
                            key={option.value}
                            className={`cursor-pointer transition-all hover:shadow-lg ${state.backFace === option.value ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{option.label}</CardTitle>
                                    {state.backFace === option.value && (
                                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                                <CardDescription>{option.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
