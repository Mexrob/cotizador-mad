'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { StepProps, BackFace, KitConfigResponse } from '../types'

export default function StepBackFace({ state, updateState, configData, stepNumber = 6 }: StepProps & { configData?: KitConfigResponse | null, stepNumber?: number }) {
    const options = configData?.backFaces?.length ? configData.backFaces : [
        { name: 'Blanca', description: 'Cara trasera con acabado blanco estándar', isTwoSided: false },
        { name: 'Especialidad', description: 'Cara trasera con acabado especial personalizado (+ $100.00 MXN)', isTwoSided: false },
        { name: 'Dos Caras', description: 'Mismo acabado en ambas caras de la puerta (Precio según ajuste de tono)', isTwoSided: true }
    ];

    const handleSelect = (option: any) => {
        updateState({
            backFace: option.name as BackFace,
            optionals: {
                ...state.optionals,
                isTwoFaces: option.isTwoSided
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Cara Trasera</h2>
                <p className="text-muted-foreground">Selecciona el acabado de la cara trasera</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {options.map((option) => (
                        <Card
                            key={option.name}
                            className={`cursor-pointer transition-all hover:shadow-lg ${state.backFace === option.name ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(option)}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle>{option.name}</CardTitle>
                                    {state.backFace === option.name && (
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
