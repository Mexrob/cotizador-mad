'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Package, Zap } from 'lucide-react'
import { StepProps } from '../types'

export default function StepOptionals({ state, updateState }: StepProps) {
    const handleToggle = (field: 'isExhibition' | 'isExpressDelivery') => {
        updateState({
            optionals: {
                ...state.optionals,
                [field]: !state.optionals[field],
            },
        })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 8: Opciones Adicionales</h2>
                <p className="text-muted-foreground">Selecciona opciones adicionales (opcional)</p>
            </div>

            <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Producto de Exhibición */}
                    <Card
                        className={`cursor-pointer transition-all hover:shadow-lg ${state.optionals.isExhibition ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                        onClick={() => handleToggle('isExhibition')}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={state.optionals.isExhibition}
                                        onCheckedChange={() => handleToggle('isExhibition')}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Package className="h-4 w-4" />
                                            Producto de Exhibición
                                        </CardTitle>
                                        <CardDescription>
                                            Producto especial para exhibición en tienda
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary">+$500</Badge>
                            </div>
                        </CardHeader>
                    </Card>

                    {/* Entrega Express */}
                    <Card
                        className={`cursor-pointer transition-all hover:shadow-lg ${state.optionals.isExpressDelivery ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                        onClick={() => handleToggle('isExpressDelivery')}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        checked={state.optionals.isExpressDelivery}
                                        onCheckedChange={() => handleToggle('isExpressDelivery')}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="space-y-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Zap className="h-4 w-4" />
                                            Entrega Express
                                        </CardTitle>
                                        <CardDescription>
                                            Entrega prioritaria en tiempo reducido
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary">+$500</Badge>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        </div>
    )
}
