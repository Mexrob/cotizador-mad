'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle2,
    Ruler,
    Palette,
    Package,
    Zap,
    Hand,
    Copy
} from 'lucide-react'
import { StepProps } from '../types'
import { formatMXN } from '@/lib/utils'

export default function StepSummary({ state, updateState, stepNumber = 10 }: StepProps & { stepNumber?: number }) {
    const { dimensions, frontDimensions, optionals, pricing } = state

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                    <h2 className="text-2xl font-bold">Paso {stepNumber}: Resumen</h2>
                </div>
                <p className="text-muted-foreground">Revisa tu configuración antes de continuar</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
                {/* Categoría y Línea */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Producto Base</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Categoría:</span>
                            <Badge variant="secondary">{state.category}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Línea:</span>
                            <Badge variant="secondary">{state.line}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Dimensiones */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Ruler className="h-4 w-4" />
                            Dimensiones
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Principales</p>
                                <p className="text-sm text-muted-foreground">
                                    {dimensions.width}mm × {dimensions.height}mm
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Frente</p>
                                <p className="text-sm text-muted-foreground">
                                    {frontDimensions.width}mm × {frontDimensions.height}mm
                                </p>
                            </div>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Cantidad:</span>
                            <Badge>{dimensions.quantity} {dimensions.quantity === 1 ? 'unidad' : 'unidades'}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Acabados */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Acabados
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                {state.line === 'Línea Alhú' ? 'Tono Vidrio:' : 'Tono:'}
                            </span>
                            <span className="text-sm font-medium">{state.tone}</span>
                        </div>
                        {state.line !== 'Línea Alhú' && state.line !== 'Europea Básica' && state.line !== 'Europea Sincro' && state.line !== 'Alto Brillo' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Cara Trasera:</span>
                                    <span className="text-sm font-medium">
                                        {state.backFace}
                                        {state.backFace === 'Especialidad' && ' (+ $100.00)'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Cubrecanto:</span>
                                    <span className="text-sm font-medium">{state.edgeBanding}</span>
                                </div>
                            </>
                        )}
                        {state.line === 'Línea Alhú' && (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tono Aluminio:</span>
                                    <span className="text-sm font-medium">{state.edgeBanding}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Cara Trasera:</span>
                                    <span className="text-sm font-medium">
                                        {state.backFace}
                                        {state.backFace === 'Especialidad' && ' (+ $100.00)'}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Grain - Show for Europea */}
                        {['Europea Básica', 'Europea Sincro'].includes(state.line || '') && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Veta:</span>
                                <span className="text-sm font-medium">{state.backFace || '-'}</span>
                            </div>
                        )}

                        {/* Edge Banding - Show for Alhú, Europea Básica, Europea Sincro, Alto Brillo */}
                        {['Línea Alhú', 'Europea Básica', 'Europea Sincro', 'Alto Brillo'].includes(state.line || '') && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Cubrecanto:</span>
                                <span className="text-sm font-medium">{state.edgeBanding || '-'}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Jaladera */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Hand className="h-4 w-4" />
                            Jaladera
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{state.handle}</span>
                            {state.handle !== 'No aplica' && pricing.handlePrice > 0 && (
                                <Badge variant="outline">{formatMXN(pricing.handlePrice)}</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Opcionales */}
                {(optionals.isExhibition || optionals.isExpressDelivery || optionals.isTwoFaces) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Opciones Adicionales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {optionals.isTwoFaces && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Copy className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Dos Caras (Mismo tono)</span>
                                    </div>
                                    <Badge variant="secondary" className="text-purple-600 bg-purple-100">
                                        Sí
                                    </Badge>
                                </div>
                            )}
                            {optionals.isExhibition && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Producto de Exhibición (-25%)</span>
                                    </div>
                                    <Badge variant="secondary" className="text-green-600 bg-green-100">
                                        {formatMXN(pricing.exhibitionFee)}
                                    </Badge>
                                </div>
                            )}
                            {optionals.isExpressDelivery && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">Entrega Express (+20%)</span>
                                    </div>
                                    <Badge variant="secondary" className="text-blue-600 bg-blue-100">
                                        +{formatMXN(pricing.expressDeliveryFee)}
                                    </Badge>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Resumen de Precios */}
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle>Resumen de Precios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Precio Base:</span>
                            <span className="text-sm font-medium">{formatMXN(pricing.basePrice)}</span>
                        </div>
                        {pricing.handlePrice > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Jaladera:</span>
                                <span className="text-sm font-medium">{formatMXN(pricing.handlePrice)}</span>
                            </div>
                        )}
                        {state.backFace === 'Especialidad' && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Acabado Trasero:</span>
                                <span className="text-sm font-medium">{formatMXN(100)}</span>
                            </div>
                        )}
                        {pricing.exhibitionFee !== 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Exhibición (Descuento):</span>
                                <span className="text-sm font-medium text-green-600">{formatMXN(pricing.exhibitionFee)}</span>
                            </div>
                        )}
                        {pricing.expressDeliveryFee > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Entrega Express:</span>
                                <span className="text-sm font-medium text-blue-600">+{formatMXN(pricing.expressDeliveryFee)}</span>
                            </div>
                        )}
                        <Separator />
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-primary">{formatMXN(pricing.total)}</span>
                        </div>

                        {/* Delivery time for Cerámica, Alhú, Europea Básica, Europea Sincro and Alto Brillo */}
                        {(state.line === 'Cerámica' || state.line === 'Línea Alhú' || state.line === 'Europea Básica' || state.line === 'Europea Sincro' || state.line === 'Alto Brillo') && state.deliveryDays > 0 && (
                            <>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tiempo de Entrega:</span>
                                    <Badge variant="outline">{state.deliveryDays} días hábiles</Badge>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
