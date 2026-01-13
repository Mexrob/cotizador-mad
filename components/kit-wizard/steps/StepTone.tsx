'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { StepProps, TONES, CERAMIC_TONES, TONE_PRICES, KitConfigResponse, DBProductLine, DBProductTone } from '../types'
import { formatMXN } from '@/lib/utils'
import Image from 'next/image'

interface StepToneProps extends Partial<StepProps> {
    selectedTone?: string | null
    onSelect?: (tone: string) => void
    customTones?: string[]
    line?: string // override line from state
    stepNumber?: number
    configData?: KitConfigResponse | null
}

export default function StepTone({ state, updateState, stepNumber = 4, configData }: StepProps & { stepNumber?: number, configData?: KitConfigResponse | null }) {
    const handleSelect = (tone: string) => {
        if (updateState) {
            updateState({ tone })
        }
    }

    const currentLine = state?.line
    const currentSelection = state?.tone

    // Get tones based on selected line or custom props from configData
    const lineData = configData?.lines.find((l: DBProductLine) => l.name === currentLine)
    const availableTones = lineData?.tones.map((t: DBProductTone) => t.name) || (currentLine === 'Cerámica' ? CERAMIC_TONES : TONES)

    // Helper to get price dynamically
    const getPrice = (toneName: string) => {
        const tone = lineData?.tones.find((t: DBProductTone) => t.name === toneName)
        return tone ? Number(tone.priceAdjustment) : (TONE_PRICES[toneName] || 0)
    }

    const materialName = currentLine === 'Cerámica' ? 'cerámica' : 'vidrio'
    const stepTitle = currentLine === 'Cerámica' ? 'Marca' : 'Tono'

    const getToneImage = (tone: string) => {
        // For ceramic brands, show brand logos
        if (currentLine === 'Cerámica') {
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
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Tono</h2>
                <p className="text-muted-foreground">Selecciona el tono o color de la {materialName}</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableTones.map((tone) => (
                        <Card
                            key={tone}
                            className={`cursor-pointer transition-all hover:shadow-lg ${currentSelection === tone ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(tone)}
                        >
                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-white">
                                <Image
                                    src={getToneImage(tone)}
                                    alt={tone}
                                    fill
                                    className={`transition-transform hover:scale-105 ${currentLine === 'Cerámica' ? 'object-contain p-4' : 'object-contain p-2'}`}
                                />
                            </div>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 space-y-1">
                                        <p className="font-medium text-sm">{tone}</p>
                                        <div className="flex flex-col gap-1">
                                            {/* Logic for price display could be improved with a customPrices prop, 
                                                but for now falling back to TONE_PRICES or hidden */}
                                            {getPrice(tone) > 0 ? (
                                                <>
                                                    <Badge variant="secondary" className="text-xs w-fit">
                                                        {formatMXN(getPrice(tone))}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground">precio base por m²</p>
                                                </>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs w-fit">
                                                    Ver cotización
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    {currentSelection === tone && (
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
