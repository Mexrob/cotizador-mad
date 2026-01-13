'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { StepProps, Line, KitConfigResponse } from '../types'
import Image from 'next/image'

export default function StepLine({
    state,
    updateState,
    onNext,
    stepNumber = 2,
    configData
}: StepProps & { stepNumber?: number, configData?: KitConfigResponse | null }) {
    const handleSelect = (line: Line) => {
        updateState({ line })
        // Auto-advance to next step
        setTimeout(onNext, 300)
    }

    const lineMetadata: Record<string, { description: string; image: string }> = {
        'Vidrio': {
            description: 'Puertas con acabado de vidrio templado de alta calidad',
            image: '/images/lines/vidrio.png'
        },
        'Cerámica': {
            description: 'Puertas con acabado cerámico de alta resistencia',
            image: '/images/lines/ceramica.png'
        },
        'Línea Alhú': {
            description: 'Perfilería de aluminio con cristal',
            image: '/images/lines/alhu.png'
        },
        'Europea Básica': {
            description: 'Puertas con acabado europeo básico',
            image: '/images/lines/europea.png'
        },
        'Europea Sincro': {
            description: 'Puertas con acabado europeo sincro',
            image: '/images/lines/europea-sincro.png'
        },
        'Alto Brillo': {
            description: 'Puertas con acabado alto brillo',
            image: '/images/lines/alto-brillo.png'
        },
        'Super Mate': {
            description: 'Puertas con acabado super mate',
            image: '/images/lines/alto-brillo.png' // Placeholder image
        }
    }

    // Prepare lines from configData if available, fallback to hardcoded list
    const availableLines = configData?.lines.map(l => ({
        value: l.name as Line,
        label: l.name,
        description: lineMetadata[l.name]?.description || 'Línea de producto personalizada',
        image: lineMetadata[l.name]?.image || '/images/lines/europea.png'
    })) || Object.entries(lineMetadata).map(([name, meta]) => ({
        value: name as Line,
        label: name,
        ...meta
    }))

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Línea</h2>
                <p className="text-muted-foreground">Selecciona la línea de producto</p>
            </div>

            <div className="grid gap-4 max-w-5xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
                {availableLines.map((line) => (
                    <Card
                        key={line.value}
                        className={`cursor-pointer transition-all hover:shadow-lg ${state.line === line.value ? 'border-primary ring-2 ring-primary' : ''
                            }`}
                        onClick={() => handleSelect(line.value)}
                    >
                        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-white">
                            <Image
                                src={line.image}
                                alt={line.label}
                                fill
                                className="object-contain p-4 transition-transform hover:scale-105"
                            />
                        </div>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>{line.label}</CardTitle>
                                {state.line === line.value && (
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                            <CardDescription>
                                {line.description}
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ))}
            </div>
        </div>
    )
}
