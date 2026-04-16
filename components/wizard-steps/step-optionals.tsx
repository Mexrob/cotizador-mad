'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { Package, Zap, Layers } from 'lucide-react'

export function StepOptionals({ state, updateState, config }: WizardStepProps) {
    const optionals = (state.data.optionals as { 
        isExhibition: boolean; 
        isExpressDelivery: boolean; 
        isTwoFaces: boolean 
    }) || { isExhibition: false, isExpressDelivery: false, isTwoFaces: false }

    const showExhibition = (config.config.showExhibition as boolean) !== false
    const showExpress = (config.config.showExpress as boolean) !== false
    const showTwoSided = (config.config.showTwoSided as boolean) !== false

    const handleToggle = (field: keyof typeof optionals, value: boolean) => {
        updateState({
            data: {
                ...state.data,
                optionals: {
                    ...optionals,
                    [field]: value
                },
                [`optionals.${field}`]: value
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Opcionales</h2>
                <p className="text-muted-foreground">Selecciona las opciones adicionales</p>
            </div>

            <div className="max-w-2xl mx-auto space-y-4">
                {showExhibition && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Package className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <Label htmlFor="exhibition" className="text-base font-medium">
                                            Exhibición
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Producto para exhibición en showroom
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="exhibition"
                                    checked={optionals.isExhibition}
                                    onCheckedChange={(checked) => handleToggle('isExhibition', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {showExpress && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Zap className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <Label htmlFor="express" className="text-base font-medium">
                                            Entrega Express
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Entrega prioritaria en menor tiempo
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="express"
                                    checked={optionals.isExpressDelivery}
                                    onCheckedChange={(checked) => handleToggle('isExpressDelivery', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {showTwoSided && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Layers className="w-5 h-5 text-muted-foreground" />
                                    <div>
                                        <Label htmlFor="twosided" className="text-base font-medium">
                                            Dos Caras
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Acabado por ambas caras del producto
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    id="twosided"
                                    checked={optionals.isTwoFaces}
                                    onCheckedChange={(checked) => handleToggle('isTwoFaces', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
