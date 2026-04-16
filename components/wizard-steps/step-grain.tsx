'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'
import { ArrowUp, ArrowRight } from 'lucide-react'

type GrainDirection = 'Horizontal' | 'Vertical'

export function StepGrain({ state, updateState, onNext }: WizardStepProps) {
    const selectedGrain = state.data.grain as GrainDirection

    const handleSelect = (grain: GrainDirection) => {
        updateState({
            data: {
                ...state.data,
                grain,
                grainDirection: grain.toLowerCase()
            }
        })
        setTimeout(onNext, 300)
    }

    const options: { value: GrainDirection; label: string; icon: React.ReactNode; description: string }[] = [
        {
            value: 'Vertical',
            label: 'Vertical',
            icon: <ArrowUp className="w-8 h-8" />,
            description: 'Veta que corre de arriba hacia abajo'
        },
        {
            value: 'Horizontal',
            label: 'Horizontal',
            icon: <ArrowRight className="w-8 h-8" />,
            description: 'Veta que corre de lado a lado'
        }
    ]

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Dirección de Veta</h2>
                <p className="text-muted-foreground">Selecciona la orientación de la veta</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto sm:grid-cols-2">
                {options.map((option) => (
                    <Card
                        key={option.value}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedGrain === option.value && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(option.value)}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {option.icon}
                                    <CardTitle>{option.label}</CardTitle>
                                </div>
                                {selectedGrain === option.value && (
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
    )
}
