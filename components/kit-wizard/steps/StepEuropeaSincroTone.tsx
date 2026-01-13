import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { formatMXN } from '@/lib/utils'
import { KitConfigResponse } from '../types'

export const EUROPEA_SINCRO_FALLBACK = [
    { name: 'Roma', price: 1400 },
    { name: 'Parma', price: 1400 },
    { name: 'Genova', price: 1400 },
    { name: 'Pisa', price: 1400 },
    { name: 'Turín', price: 1400 },
]

interface StepEuropeaSincroToneProps {
    value: string | null
    onChange: (value: string) => void
    stepNumber?: number
    configData?: KitConfigResponse | null
}

export default function StepEuropeaSincroTone({
    value,
    onChange,
    stepNumber = 4,
    configData
}: StepEuropeaSincroToneProps) {
    const lineData = configData?.lines.find(l => l.name === 'Europea Sincro')
    const tones = lineData?.tones.map(t => ({
        name: t.name,
        price: Number(t.priceAdjustment)
    })) || EUROPEA_SINCRO_FALLBACK

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Tono o Color</h2>
                <p className="text-muted-foreground">Selecciona el acabado de tu puerta</p>
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
                                        <p className="font-medium text-base leading-tight">{tone.name}</p>
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
