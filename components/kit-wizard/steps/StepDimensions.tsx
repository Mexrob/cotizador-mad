'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Ruler } from 'lucide-react'
import { StepProps, DIMENSION_LIMITS } from '../types'

export default function StepDimensions({ state, updateState }: StepProps) {
    const { dimensions } = state

    // Get limits based on selected line
    const limits = state.line === 'Cerámica' ? DIMENSION_LIMITS.ceramica : DIMENSION_LIMITS.vidrio

    const handleDimensionChange = (field: keyof typeof dimensions, value: string) => {
        const numValue = parseInt(value) || 0
        updateState({
            dimensions: {
                ...dimensions,
                [field]: numValue,
            },
        })
    }

    const isWidthValid = dimensions.width >= limits.width.min &&
        dimensions.width <= limits.width.max
    const isHeightValid = dimensions.height >= limits.height.min &&
        dimensions.height <= limits.height.max

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 3: Dimensiones</h2>
                <p className="text-muted-foreground">Define las medidas en milímetros</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Todas las medidas deben estar en milímetros (mm)
                    </AlertDescription>
                </Alert>

                {/* Dimensiones Principales */}
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
                                    min={limits.width.min}
                                    max={limits.width.max}
                                    value={dimensions.width || ''}
                                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                                    className={!isWidthValid && dimensions.width > 0 ? 'border-destructive' : ''}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Mínimo: {limits.width.min}mm | Máximo: {limits.width.max}mm
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    min={limits.height.min}
                                    max={limits.height.max}
                                    value={dimensions.height || ''}
                                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                                    className={!isHeightValid && dimensions.height > 0 ? 'border-destructive' : ''}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Mínimo: {limits.height.min}mm | Máximo: {limits.height.max}mm
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="quantity">Cantidad</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min={1}
                                value={dimensions.quantity || ''}
                                onChange={(e) => handleDimensionChange('quantity', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>


            </div>
        </div>
    )
}
