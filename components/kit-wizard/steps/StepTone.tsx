'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { StepProps, TONES, CERAMIC_TONES, TONE_PRICES } from '../types'
import { formatMXN } from '@/lib/utils'
import Image from 'next/image'

export default function StepTone({ state, updateState }: StepProps) {
    const handleSelect = (tone: string) => {
        updateState({ tone })
    }

    // Get tones based on selected line
    const availableTones = state.line === 'Cerámica' ? CERAMIC_TONES : TONES
    const materialName = state.line === 'Cerámica' ? 'cerámica' : 'vidrio'
    const stepTitle = state.line === 'Cerámica' ? 'Marca' : 'Tono'

    const getToneImage = (tone: string) => {
        // For ceramic brands, show brand logos
        if (state.line === 'Cerámica') {
            const brandSlug = tone.toLowerCase().replace(/\s+/g, '-')
            return `/images/brands/${brandSlug}.png`
        }
        // For glass tones, show tone images
        const color = tone.split(' - ')[0].toLowerCase()
        return `/images/tones/${color}.png`
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 4: {stepTitle}</h2>
                <p className="text-muted-foreground">Selecciona el tono o color de la {materialName}</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTones.map((tone) => (
                        <Card
                            key={tone}
                            className={`cursor-pointer transition-all hover:shadow-lg ${state.tone === tone ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(tone)}
                        >
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-white">
                                <Image
                                    src={getToneImage(tone)}
                                    alt={tone}
                                    fill
                                    className={`transition-transform hover:scale-105 ${state.line === 'Cerámica' ? 'object-contain p-4' : 'object-contain p-2'}`}
                                />
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium text-sm">{tone}</p>
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="secondary" className="text-xs w-fit">
                                                {TONE_PRICES[tone] ? formatMXN(TONE_PRICES[tone]) : 'N/A'}
                                            </Badge>
                                            <p className="text-xs text-muted-foreground">precio base por m²</p>
                                        </div>
                                    </div>
                                    {state.tone === tone && (
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
