'use client'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { formatMXN } from '@/lib/utils'
import { KitConfigResponse } from '../types'

export const GLASS_FALLBACK = [
    { name: 'Natural', price: 4440 },
    { name: 'Ahumado Claro', price: 4440 },
    { name: 'Bronce texturizado con 1 capa de pintura', price: 4440 },
    { name: 'Espejo bronce de 6mm', price: 4440 },
    { name: 'Tela encapsulada en vidrio ultraclaro de 4+4', price: 4440 },
    { name: 'Tela encapsulada en vidrio claro de 4+4', price: 4440 },
    { name: 'Espejo claro Anticado de 6mm', price: 4440 },
    { name: 'Filtrasol Texturizado de 6mm', price: 4440 },
    { name: 'Vidrio claro texturizado de 6mm con pintura', price: 4440 },
    { name: 'Vidrio Cristazul texturizado de 6mm', price: 4440 },
]

interface StepGlassToneProps {
    value: string | null
    onChange: (value: string) => void
    stepNumber?: number
    configData?: KitConfigResponse | null
}

export default function StepGlassTone({
    value,
    onChange,
    stepNumber = 5,
    configData
}: StepGlassToneProps) {
    const lineData = configData?.lines.find(l => l.name === 'Línea Alhú')
    const tones = lineData?.tones.map(t => ({
        name: t.name,
        price: Number(t.priceAdjustment)
    })) || GLASS_FALLBACK

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Tono del Vidrio</h2>
                <p className="text-muted-foreground">Selecciona el tipo de vidrio</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tones.map((tone) => (
                        <Card
                            key={tone.name}
                            className={`cursor-pointer transition-all hover:shadow-lg ${value === tone.name ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => onChange(tone.name)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-2">
                                        <p className="font-medium text-sm leading-tight">{tone.name}</p>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="secondary" className="text-xs w-fit">
                                                {formatMXN(tone.price)}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">precio base por m²</p>
                                        </div>
                                    </div>
                                    {value === tone.name && (
                                        <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                            <Check className="h-4 w-4 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
