import { Card, CardContent } from "@/components/ui/card"
import { Check, ArrowRightLeft } from "lucide-react"


interface StepGrainProps {
    value: string | null
    onChange: (value: string) => void
    stepNumber?: number
}

const GRAIN_OPTIONS = [
    {
        name: 'Horizontal',
        description: 'Veta en dirección horizontal',
        icon: '↔️',
        image: '/images/patterns/vertical.png',
        imageClass: 'rotate-90 scale-150' // scale to cover after rotation if needed, or object-cover might handle it but rotation changes aspect ratio fit. 
        // If I rotate 90deg inside a container, a rectangular image might show gaps if not square. The previous image looked square-ish or repeated pattern.
        // Let's try just rotate-90 first. w-full h-full object-cover might work if container is square. 
        // Container is h-32 w-full.
        // If I rotate a landscape/portrait image 90deg, it might fit differently.
        // 'object-cover' usually handles filling. 
        // But 'rotate-90' rotates the element. 
        // Only safely works if image is square. 
        // If not square, might need scale.
        // I'll stick to 'rotate-90' for now.
    },
    {
        name: 'Vertical',
        description: 'Veta en dirección vertical',
        icon: '↕️',
        image: '/images/patterns/vertical.png'
    },
]

export default function StepGrain({ value, onChange, stepNumber = 5 }: StepGrainProps) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Dirección de la Veta</h2>
                <p className="text-muted-foreground">
                    Selecciona la orientación del patrón de la madera
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {GRAIN_OPTIONS.map((grain) => (
                    <Card
                        key={grain.name}
                        className={`cursor-pointer transition-all hover:scale-105 ${value === grain.name ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'
                            }`}
                        onClick={() => onChange(grain.name)}
                    >
                        <CardContent className="p-6 space-y-4">
                            <div className="text-center">
                                {/* Show image if available, otherwise show icon */}
                                {(grain as any).image ? (
                                    <div className="relative w-full h-32 mb-4 rounded-md overflow-hidden bg-muted">
                                        <img
                                            src={(grain as any).image}
                                            alt={grain.name}
                                            className={`w-full h-full object-cover ${(grain as any).imageClass || ''}`}
                                        />
                                    </div>
                                ) : (
                                    <div className="text-6xl mb-4">{grain.icon}</div>
                                )}
                                <h3 className="font-semibold text-lg">{grain.name}</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {grain.description}
                                </p>
                            </div>
                            {value === grain.name && (
                                <div className="flex justify-center">
                                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                                        <Check className="w-5 h-5" />
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
