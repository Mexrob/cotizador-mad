'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Loader2 } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

interface EdgeBanding {
    id: string
    name: string
    description: string | null
    imageUrl: string | null
}

export function StepEdgeBanding({ state, updateState, onNext, config }: WizardStepProps) {
    const [edgeBandings, setEdgeBandings] = useState<EdgeBanding[]>([])
    const [loading, setLoading] = useState(true)
    const selectedEdgeBanding = state.data.edgeBanding as string
    const autoSelect = config.config.autoSelect as boolean

    useEffect(() => {
        const loadEdgeBandings = async () => {
            try {
                setLoading(true)
                const response = await fetch('/api/edge-bandings')
                const result = await response.json()
                if (result.success) {
                    setEdgeBandings(result.data)
                    
                    // Auto-seleccionar si está configurado y hay opciones
                    if (autoSelect && result.data.length > 0 && !selectedEdgeBanding) {
                        const first = result.data[0]
                        updateState({
                            data: {
                                ...state.data,
                                edgeBanding: first.name,
                                edgeBandingId: first.id
                            }
                        })
                    }
                }
            } catch (error) {
                console.error('Error loading edge bandings:', error)
            } finally {
                setLoading(false)
            }
        }

        loadEdgeBandings()
    }, [autoSelect])

    const handleSelect = (edgeBanding: EdgeBanding) => {
        updateState({
            data: {
                ...state.data,
                edgeBanding: edgeBanding.name,
                edgeBandingId: edgeBanding.id
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
                <h2 className="text-2xl font-bold">Cubrecanto</h2>
                <p className="text-muted-foreground">Selecciona el tipo de cubrecanto</p>
            </div>

            <div className="grid gap-4 max-w-2xl mx-auto">
                {edgeBandings.map((edgeBanding) => (
                    <Card
                        key={edgeBanding.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedEdgeBanding === edgeBanding.name && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(edgeBanding)}
                    >
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{edgeBanding.name}</CardTitle>
                                {selectedEdgeBanding === edgeBanding.name && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            {edgeBanding.description && (
                                <CardDescription>{edgeBanding.description}</CardDescription>
                            )}
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
