'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

interface ProductLine {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
}

export function StepLine({ state, updateState, onNext, config }: WizardStepProps) {
    const [lines, setLines] = useState<ProductLine[]>([])
    const [loading, setLoading] = useState(true)
    const selectedLine = state.data.line as string
    const selectedCategory = state.data.category as string
    const filterByCategory = config.config.filterByCategory as boolean

    useEffect(() => {
        const loadLines = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/product-lines')
                const result = await response.json()
                if (result.success) {
                    setLines(result.data)
                }
            } catch (error) {
                console.error('Error loading lines:', error)
            } finally {
                setLoading(false)
            }
        }

        loadLines()
    }, [])

    const handleSelect = (line: ProductLine) => {
        updateState({ 
            data: { 
                ...state.data, 
                line: line.name,
                lineId: line.id 
            }
        })
        setTimeout(onNext, 300)
    }

    const filteredLines = filterByCategory && selectedCategory
        ? lines // Aquí podrías filtrar por categoría si tienes esa relación
        : lines

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
                <h2 className="text-2xl font-bold">Línea de Producto</h2>
                <p className="text-muted-foreground">Selecciona la línea de producto</p>
            </div>

            <div className="grid gap-4 max-w-5xl mx-auto grid-cols-2">
                {filteredLines.map((line) => (
                    <Card
                        key={line.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedLine === line.name && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(line)}
                    >
                        {line.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-white">
                                <img
                                    src={line.imageUrl}
                                    alt={line.name}
                                    className="object-contain p-4 w-full h-full transition-transform hover:scale-105"
                                />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{line.name}</CardTitle>
                                {selectedLine === line.name && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            {line.description && (
                                <CardDescription>{line.description}</CardDescription>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
