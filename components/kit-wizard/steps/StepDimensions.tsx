'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info, Ruler } from 'lucide-react'
import { StepProps, DIMENSION_LIMITS, WizardState } from '../types'

interface StepDimensionsProps {
    state?: WizardState
    updateState?: (updates: Partial<WizardState>) => void
    limits?: {
        width: { min: number, max: number }
        height: { min: number, max: number }
    }
    values?: {
        width: number
        height: number
        quantity: number
    }
    onChange?: (values: { width: number, height: number, quantity: number }) => void
    stepNumber?: number
}

export default function StepDimensions({ state, updateState, limits, values: customValues, onChange, stepNumber = 3 }: StepDimensionsProps) {
    // Resolve values: use custom props if available, otherwise fall back to state
    const dimensions = customValues || state?.dimensions || { width: 0, height: 0, quantity: 1 }

    // Resolve limits: use custom props if available, otherwise derive from state
    // We prioritize the 'limits' prop if passed (e.g. from KitWizard for specific lines)
    const resolvedLimits = limits || (state?.line === 'Cerámica' ? DIMENSION_LIMITS.ceramica : DIMENSION_LIMITS.vidrio)

    const handleDimensionChange = (field: keyof typeof dimensions, value: string) => {
        const numValue = parseInt(value) || 0
        const newDimensions = {
            ...dimensions,
            [field]: numValue,
        }

        if (onChange) {
            onChange(newDimensions)
        } else if (updateState) {
            updateState({
                dimensions: newDimensions,
            })
        }
    }

    const isWidthValid = dimensions.width >= resolvedLimits.width.min &&
        dimensions.width <= resolvedLimits.width.max
    const isHeightValid = dimensions.height >= resolvedLimits.height.min &&
        dimensions.height <= resolvedLimits.height.max

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Dimensiones</h2>
                <p className="text-muted-foreground">Define las medidas en milímetros</p>
                {/* Reference texts as requested in prompt */}
                {resolvedLimits && (
                    <div className="text-xs text-muted-foreground grid grid-cols-2 gap-2 max-w-sm mx-auto mt-2">
                        <span>Ancho Mínimo: {resolvedLimits.width.min}mm</span>
                        <span>Ancho Máximo: {resolvedLimits.width.max}mm</span>
                        <span>Alto Mínimo: {resolvedLimits.height.min}mm</span>
                        <span>Alto Máximo: {resolvedLimits.height.max}mm</span>
                    </div>
                )}
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
                                    min={resolvedLimits.width.min}
                                    max={resolvedLimits.width.max}
                                    value={dimensions.width || ''}
                                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                                    className={!isWidthValid && dimensions.width > 0 ? 'border-destructive' : ''}
                                />
                                {!isWidthValid && dimensions.width > 0 ? (
                                    <p className="text-xs text-destructive font-medium">
                                        El ancho debe estar entre {resolvedLimits.width.min}mm y {resolvedLimits.width.max}mm
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Mínimo: {resolvedLimits.width.min}mm | Máximo: {resolvedLimits.width.max}mm
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="height">Alto (mm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    min={resolvedLimits.height.min}
                                    max={resolvedLimits.height.max}
                                    value={dimensions.height || ''}
                                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                                    className={!isHeightValid && dimensions.height > 0 ? 'border-destructive' : ''}
                                />
                                {!isHeightValid && dimensions.height > 0 ? (
                                    <p className="text-xs text-destructive font-medium">
                                        El alto debe estar entre {resolvedLimits.height.min}mm y {resolvedLimits.height.max}mm
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Mínimo: {resolvedLimits.height.min}mm | Máximo: {resolvedLimits.height.max}mm
                                    </p>
                                )}
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
