'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Ruler } from 'lucide-react'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { cn } from '@/lib/utils'

export function StepDimensions({ state, updateState, config }: WizardStepProps) {
    const dimensions = (state.data.dimensions as { width: number; height: number; quantity: number }) || { width: 0, height: 0, quantity: 1 }
    
    const minWidth = (config.config.minWidth as number) || 100
    const maxWidth = (config.config.maxWidth as number) || 2400
    const minHeight = (config.config.minHeight as number) || 100
    const maxHeight = (config.config.maxHeight as number) || 2700
    const allowQuantity = (config.config.allowQuantity as boolean) !== false

    const handleDimensionChange = (field: keyof typeof dimensions, value: string) => {
        const numValue = parseInt(value) || 0
        updateState({
            data: {
                ...state.data,
                dimensions: {
                    ...dimensions,
                    [field]: numValue,
                }
            }
        })
    }

    const isWidthValid = dimensions.width >= minWidth && dimensions.width <= maxWidth
    const isHeightValid = dimensions.height >= minHeight && dimensions.height <= maxHeight

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Dimensiones</h2>
                <p className="text-muted-foreground">Define las medidas en milímetros</p>
                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 max-w-sm mx-auto mt-2">
                    <span>Ancho: {minWidth}mm - {maxWidth}mm</span>
                    <span>Alto: {minHeight}mm - {maxHeight}mm</span>
                </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Todas las medidas deben estar en milímetros (mm)
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Ruler className="h-5 w-5" />
                            Dimensiones Principales
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="width">Ancho (mm)</Label>
                                <Input
                                    id="width"
                                    type="number"
                                    min={minWidth}
                                    max={maxWidth}
                                    value={dimensions.width || ''}
                                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                                    className={cn(!isWidthValid && dimensions.width > 0 && 'border-destructive')}
                                />
                                {!isWidthValid && dimensions.width > 0 && (
                                    <p className="text-sm text-destructive">
                                        El ancho debe estar entre {minWidth}mm y {maxWidth}mm
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    min={minHeight}
                                    max={maxHeight}
                                    value={dimensions.height || ''}
                                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                                    className={cn(!isHeightValid && dimensions.height > 0 && 'border-destructive')}
                                />
                                {!isHeightValid && dimensions.height > 0 && (
                                    <p className="text-sm text-destructive">
                                        El alto debe estar entre {minHeight}mm y {maxHeight}mm
                                    </p>
                                )}
                            </div>
                        </div>

                        {allowQuantity && (
                            <div className="space-y-2 max-w-[200px]">
                                <Label htmlFor="quantity">Cantidad</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={dimensions.quantity || 1}
                                    onChange={(e) => handleDimensionChange('quantity', e.target.value)}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
