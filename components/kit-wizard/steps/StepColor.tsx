'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { StepProps, CERAMIC_COLORS } from '../types'
import Image from 'next/image'

export default function StepColor({ state, updateState }: StepProps) {
    const handleSelect = (color: string) => {
        updateState({ color })
    }

    // Get available colors based on selected brand (tone)
    const availableColors = state.tone ? CERAMIC_COLORS[state.tone] || [] : []

    // Only show this step for Cerámica line
    if (state.line !== 'Cerámica') {
        return null
    }

    const getColorImage = (color: string) => {
        // Get brand slug for image path
        const brandSlug = state.tone?.toLowerCase().replace(/\s+/g, '-') || ''
        const colorSlug = color.toLowerCase()
        return `/images/colors/${brandSlug}/${colorSlug}.png`
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 5: Color</h2>
                <p className="text-muted-foreground">
                    Selecciona el color de {state.tone}
                </p>
            </div>

            <div className="max-w-4xl mx-auto">
                {availableColors.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {availableColors.map((color) => (
                            <Card
                                key={color}
                                className={`cursor-pointer transition-all hover:shadow-lg ${state.color === color ? 'border-primary ring-2 ring-primary' : ''
                                    }`}
                                onClick={() => handleSelect(color)}
                            >
                                <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-white">
                                    <Image
                                        src={getColorImage(color)}
                                        alt={color}
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                                <CardContent className="p-3">
                                    <div className="flex items-center justify-center">
                                        {state.color === color && (
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                <Check className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>No hay colores disponibles para esta marca.</p>
                        <p className="text-sm mt-2">Por favor, selecciona una marca diferente.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
