import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"
import { KitConfigResponse } from "../types"

interface StepAltoBrilloToneProps {
    value: string | null
    onChange: (value: string) => void
    stepNumber?: number
    configData?: KitConfigResponse | null
}

export const ALTO_BRILLO_FALLBACK = [
    { name: 'Alaska', price: 1998 },
    { name: 'Obsidiana', price: 2087 },
    { name: 'Magnesio', price: 2087 },
    { name: 'Topacio', price: 2087 },
]

export default function StepAltoBrilloTone({
    value,
    onChange,
    stepNumber = 4,
    configData
}: StepAltoBrilloToneProps) {
    const lineData = configData?.lines.find(l => l.name === 'Alto Brillo')
    const tones = lineData?.tones.map(t => ({
        name: t.name,
        price: Number(t.priceAdjustment)
    })) || ALTO_BRILLO_FALLBACK

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Selección de Tono</h2>
                <p className="text-muted-foreground">
                    Elige el tono para tu puerta Alto Brillo
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {tones.map((tone) => (
                    <Card
                        key={tone.name}
                        className={`cursor-pointer transition-all hover:scale-105 ${value === tone.name ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                            }`}
                        onClick={() => onChange(tone.name)}
                    >
                        <CardContent className="p-4 space-y-4">
                            <div className="aspect-square relative mb-4 rounded-full overflow-hidden border-2 border-border">
                                {/* Placeholder for color/finish preview */}
                                <div className={`w-full h-full bg-gradient-to-br from-gray-100 to-gray-300 ${tone.name === 'Obsidiana' ? 'from-gray-800 to-black' : ''}`} />
                            </div>
                            <div className="text-center">
                                <h3 className="font-semibold">{tone.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    ${tone.price.toLocaleString('es-MX', { minimumFractionDigits: 2 })} / m²
                                </p>
                            </div>
                            {value === tone.name && (
                                <div className="flex justify-center">
                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
