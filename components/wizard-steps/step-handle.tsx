'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Loader2, ArrowUp, ArrowRight } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

interface HandleModel {
    id: string
    name: string
    model: string | null
    finish: string | null
    price: number
    priceUnit: string
    length: number | null
    imageUrl: string | null
}

export function StepHandle({ state, updateState, onNext, config }: WizardStepProps) {
    const [handles, setHandles] = useState<HandleModel[]>([])
    const [loading, setLoading] = useState(true)
    const selectedHandleId = state.data.handleId as string
    const filterByLine = config.config.filterByLine as boolean
    const selectedLineId = state.data.lineId as string
    const required = config.config.required as boolean
    
    const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>(
        (state.data.handleOrientation as 'vertical' | 'horizontal') || 'vertical'
    )
    const [lengthCm, setLengthCm] = useState<number>(
        (state.data.handleLength as number) || 0
    )

    useEffect(() => {
        const loadHandles = async () => {
            try {
                setLoading(true)
                const url = filterByLine && selectedLineId
                    ? `/api/product-lines/${selectedLineId}/handles`
                    : '/api/handle-models'
                const response = await fetch(url)
                const result = await response.json()
                if (result.success) {
                    setHandles(result.data)
                }
            } catch (error) {
                console.error('Error loading handles:', error)
            } finally {
                setLoading(false)
            }
        }

        loadHandles()
    }, [filterByLine, selectedLineId])

    const selectedHandle = handles.find(h => h.id === selectedHandleId)

    // Obtener dimensiones del paso anterior
    const dimensions = (state.data.dimensions as { width: number; height: number }) || { width: 0, height: 0 }

    const calculateHandlePrice = () => {
        if (!selectedHandle) return 0
        
        const price = Number(selectedHandle.price) || 0
        
        // Usar las dimensiones del paso anterior según la orientación
        const lengthMm = orientation === 'horizontal' ? dimensions.width : dimensions.height
        
        if (lengthMm > 0 && price > 0) {
            // Fórmula: (mm / 1000) * precio por metro lineal
            return (lengthMm / 1000) * price
        }
        
        // Si no hay dimensiones, usar el slider manual
        if (lengthCm > 0) {
            return (lengthCm / 100) * price
        }
        
        return price
    }

    const handleSelect = (handle: HandleModel) => {
        const lengthMm = orientation === 'horizontal' ? dimensions.width : dimensions.height
        setLengthCm(handle.length ? handle.length : Math.max(dimensions.width, dimensions.height))
        updateState({
            data: {
                ...state.data,
                handle: handle.name,
                handleId: handle.id,
                handlePrice: handle.price,
                handleOrientation: orientation,
                handleLength: lengthMm,
                handleTotalPrice: calculateHandlePrice()
            }
        })
    }

    const handleOrientationChange = (newOrientation: 'vertical' | 'horizontal') => {
        setOrientation(newOrientation)
        if (selectedHandle) {
            updateState({
                data: {
                    ...state.data,
                    handleOrientation: newOrientation,
                    handleTotalPrice: calculateHandlePrice()
                }
            })
        }
    }

    const handleLengthChange = (newLength: number) => {
        setLengthCm(newLength)
        if (selectedHandle) {
            updateState({
                data: {
                    ...state.data,
                    handleLength: newLength,
                    handleTotalPrice: calculateHandlePrice()
                }
            })
        }
    }

    const handleContinue = () => {
        if (selectedHandle) {
            const totalPrice = calculateHandlePrice()
            updateState({
                data: {
                    ...state.data,
                    handleOrientation: orientation,
                    handleLength: lengthCm,
                    handleTotalPrice: totalPrice
                }
            })
            setTimeout(onNext, 300)
        }
    }

    const handleSkip = () => {
        if (!required) {
            onNext()
        }
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
                <h2 className="text-2xl font-bold">Jaladera</h2>
                <p className="text-muted-foreground">
                    {required 
                        ? 'Selecciona el modelo de jaladera' 
                        : 'Selecciona el modelo de jaladera (opcional)'}
                </p>
            </div>

            <div className="grid gap-4 max-w-5xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
                {handles.map((handle) => (
                    <Card
                        key={handle.id}
                        className={cn(
                            "cursor-pointer transition-all hover:shadow-lg",
                            selectedHandleId === handle.id && 'border-primary ring-2 ring-primary'
                        )}
                        onClick={() => handleSelect(handle)}
                    >
                        {handle.imageUrl && (
                            <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-white">
                                <img
                                    src={handle.imageUrl}
                                    alt={handle.name}
                                    className="object-contain p-4 w-full h-full"
                                />
                            </div>
                        )}
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{handle.name}</CardTitle>
                                {selectedHandleId === handle.id && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            {handle.model && handle.finish && (
                                <CardDescription>
                                    Modelo: {handle.model} | Acabado: {handle.finish}
                                </CardDescription>
                            )}
                            <p className="text-sm font-medium text-primary mt-2">
                                ${Number(handle.price).toFixed(2)} {handle.priceUnit === 'ml' ? '/ metro lineal' : ''}
                            </p>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {selectedHandle && (
                <div className="max-w-md mx-auto space-y-4 p-4 bg-muted/30 rounded-lg">
                    <div className="text-center text-sm text-muted-foreground">
                        <p>Según las dimensiones: {dimensions.width}mm × {dimensions.height}mm</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Orientación</label>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleOrientationChange('vertical')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                                    orientation === 'vertical' 
                                        ? "border-primary bg-primary/10" 
                                        : "border-muted hover:border-primary/50"
                                )}
                            >
                                <ArrowUp className="w-5 h-5" />
                                <span>Vertical ({dimensions.height}mm)</span>
                            </button>
                            <button
                                onClick={() => handleOrientationChange('horizontal')}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all",
                                    orientation === 'horizontal' 
                                        ? "border-primary bg-primary/10" 
                                        : "border-muted hover:border-primary/50"
                                )}
                            >
                                <ArrowRight className="w-5 h-5" />
                                <span>Horizontal ({dimensions.width}mm)</span>
                            </button>
                        </div>
                    </div>

                    <div className="text-center p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm text-muted-foreground">Cálculo: ({orientation === 'horizontal' ? dimensions.width : dimensions.height}mm ÷ 1000) × ${Number(selectedHandle.price).toFixed(2)}</p>
                        <p className="text-2xl font-bold text-primary">
                            ${calculateHandlePrice().toFixed(2)}
                        </p>
                    </div>

                    <Button onClick={handleContinue} className="w-full">
                        Continuar
                    </Button>
                </div>
            )}

            {!required && !selectedHandle && (
                <div className="text-center">
                    <button 
                        onClick={handleSkip}
                        className="text-sm text-muted-foreground hover:text-primary underline"
                    >
                        Omitir este paso
                    </button>
                </div>
            )}
        </div>
    )
}
