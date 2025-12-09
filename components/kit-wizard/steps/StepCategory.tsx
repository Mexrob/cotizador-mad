'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { StepProps } from '../types'

export default function StepCategory({ state, updateState, onNext }: StepProps) {
    const handleSelect = () => {
        updateState({ category: 'Puertas' })
        // Auto-advance to next step
        setTimeout(onNext, 300)
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 1: Categoría</h2>
                <p className="text-muted-foreground">Selecciona la categoría de producto base</p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto">
                <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${state.category === 'Puertas' ? 'border-primary ring-2 ring-primary' : ''
                        }`}
                    onClick={handleSelect}
                >
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Puertas</CardTitle>
                            {state.category === 'Puertas' && (
                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary-foreground" />
                                </div>
                            )}
                        </div>
                        <CardDescription>
                            Kits de puertas personalizadas con diferentes acabados y opciones
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    )
}
