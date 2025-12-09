'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { StepProps, EdgeBanding } from '../types'

export default function StepEdgeBanding({ state, updateState }: StepProps) {
    const handleSelect = (edgeBanding: EdgeBanding) => {
        updateState({ edgeBanding })
    }

    // Get edge banding options based on selected line
    const materialName = state.line === 'Cerámica' ? 'cerámica' : 'vidrio'
    const similarToneValue: EdgeBanding = state.line === 'Cerámica'
        ? 'Similar al tono de la cerámica'
        : 'Similar al tono del vidrio'

    const EDGE_BANDING_OPTIONS: { value: EdgeBanding; label: string; description: string }[] = [
        {
            value: similarToneValue,
            label: `Similar al tono de la ${materialName}`,
            description: `Cubrecanto que coincide con el tono seleccionado de ${materialName}`,
        },
        {
            value: 'Tono Aluminio',
            label: 'Tono Aluminio',
            description: 'Cubrecanto con acabado aluminio',
        },
    ]

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 7: Cubrecanto</h2>
                <p className="text-muted-foreground">Selecciona el tipo de cubrecanto</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {EDGE_BANDING_OPTIONS.map((option) => (
                        <Card
                            key={option.value}
                            className={`cursor-pointer transition-all hover:shadow-lg ${state.edgeBanding === option.value ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(option.value)}
                        >
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">{option.label}</CardTitle>
                                    {state.edgeBanding === option.value && (
                                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
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
