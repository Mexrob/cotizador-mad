'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Package, Zap, Copy } from 'lucide-react'
import { StepProps, Optionals } from '../types'

interface StepOptionalsProps extends Partial<StepProps> {
    optionals?: Optionals
    onChange?: (optionals: Optionals) => void
    customLabels?: {
        exhibition?: string
        express?: string
    }
}

export default function StepOptionals({ state, updateState, stepNumber = 8, optionals: customOptionals, onChange, customLabels }: StepOptionalsProps & { stepNumber?: number }) {
    const optionals = customOptionals || state?.optionals || { isExhibition: false, isExpressDelivery: false, isTwoFaces: false }

    const handleToggle = (field: 'isExhibition' | 'isExpressDelivery') => {
        const currentOptionals = state?.optionals || optionals
        const newOptionals = {
            ...currentOptionals,
            [field]: !currentOptionals[field],
        }

        if (onChange) {
            onChange(newOptionals)
        } else if (updateState) {
            updateState({
                optionals: newOptionals
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Opciones Adicionales</h2>
                <p className="text-muted-foreground">Selecciona opciones adicionales (opcional)</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Producto de Exhibición */}
                    <Card
                        className={`cursor-pointer transition-all hover:shadow-lg ${optionals.isExhibition ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                        onClick={() => handleToggle('isExhibition')}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={optionals.isExhibition}
                                        onCheckedChange={() => handleToggle('isExhibition')}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            {customLabels?.exhibition || "Producto de Exhibición"}
                                        </CardTitle>
                                        <CardDescription>
                                            Producto especial para exhibición en tienda
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-green-600 bg-green-100">-25%</Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Entrega Express */}
                    <Card
                        className={`cursor-pointer transition-all hover:shadow-lg ${optionals.isExpressDelivery ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                        onClick={() => handleToggle('isExpressDelivery')}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={optionals.isExpressDelivery}
                                        onCheckedChange={() => handleToggle('isExpressDelivery')}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            {customLabels?.express || "Entrega Express"}
                                        </CardTitle>
                                        <CardDescription>
                                            Entrega prioritaria en tiempo reducido
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="text-blue-600 bg-blue-100">+20%</Badge>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    )
}
