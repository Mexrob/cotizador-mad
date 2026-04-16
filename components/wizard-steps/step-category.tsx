'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

export function StepCategory({ state, updateState, onNext, config }: WizardStepProps) {
    const rawCategories = config.config.categories
    let categories: string[] = ['Puertas']
    
    if (Array.isArray(rawCategories)) {
        categories = rawCategories.map((c: unknown) => {
            if (typeof c === 'string') return c
            if (typeof c === 'object' && c !== null && 'value' in c) return (c as { value: string }).value
            return String(c)
        })
    }
    
    const selectedCategory = state.data.category as string

    const handleSelect = (category: string) => {
        updateState({ 
            data: { ...state.data, category }
        })
        setTimeout(onNext, 300)
    }

    const categoryMetadata: Record<string, { description: string }> = {
        'Puertas': {
            description: 'Kits de puertas personalizadas con diferentes acabados y opciones'
        },
        'Cajones': {
            description: 'Sistemas de cajones personalizables'
        },
        'Accesorios': {
            description: 'Accesorios y complementos'
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Categoría</h2>
                <p className="text-muted-foreground">Selecciona la categoría de producto base</p>
            </div>

            <div className="grid gap-4 max-w-md mx-auto">
                {categories.map((category) => (
                    <Card
                        key={category}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedCategory === category && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(category)}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{category}</CardTitle>
                                {selectedCategory === category && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            <CardDescription>
                                {categoryMetadata[category]?.description || 'Categoría de producto'}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
