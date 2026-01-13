import { Card, CardContent } from "@/components/ui/card"
import { Check } from "lucide-react"

interface StepAluminumProps {
    value: string | null
    onChange: (value: string) => void
    stepNumber?: number
}

const ALUMINUM_TONES = [
    { name: 'Natural', color: '#E0E0E0' },
    { name: 'Negro', color: '#1F2937' },
    { name: 'Champagne', color: '#F3E5AB' },
]

export default function StepAluminum({ value, onChange, stepNumber = 4 }: StepAluminumProps) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Tono del Aluminio</h2>
                <p className="text-muted-foreground">
                    Elige el acabado para el perfil de aluminio
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {ALUMINUM_TONES.map((tone) => (
                    <Card
                        key={tone.name}
                        className={`cursor-pointer transition-all hover:scale-105 ${value === tone.name ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                            }`}
                        onClick={() => onChange(tone.name)}
                    >
                        <CardContent className="p-4 space-y-4">
                            <div
                                className="h-32 w-full rounded-md shadow-sm border"
                                style={{ backgroundColor: tone.color }}
                            />
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{tone.name}</span>
                                {value === tone.name && (
                                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
