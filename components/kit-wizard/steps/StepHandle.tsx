'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { StepProps, HANDLES, HANDLE_PRICES } from '../types'
import { formatMXN } from '@/lib/utils'
import Image from 'next/image'

export default function StepHandle({ state, updateState }: StepProps) {
    const handleSelect = (handle: string) => {
        updateState({ handle })
    }

    const getHandleImage = (handle: string) => {
        if (handle === 'No aplica') return null

        // Check for Romo/Romulo handles
        if (handle.includes('Romo') || handle.includes('Romulo')) {
            const handleName = handle.split(' ')[0].toLowerCase()
            return `/images/handles/${handleName}.png`
        }

        // Sorento handles
        const model = handle.split(' ')[1]?.toLowerCase()
        if (model) {
            return `/images/handles/sorento-${model}.png`
        }

        return null
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso 9: Jaladera</h2>
                <p className="text-muted-foreground">Selecciona el tipo de jaladera</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {HANDLES.map((handle) => (
                        <Card
                            key={handle}
                            className={`cursor-pointer transition-all hover:shadow-lg ${state.handle === handle ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(handle)}
                        >
                            <CardContent className="p-0">
                                {getHandleImage(handle) && (
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-white">
                                        <Image
                                            src={getHandleImage(handle)!}
                                            alt={handle}
                                            fill
                                            className="object-contain p-4 transition-transform hover:scale-105"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm">{handle}</p>
                                            {handle !== 'No aplica' && (
                                                <Badge variant="secondary" className="text-xs w-fit">
                                                    {formatMXN(HANDLE_PRICES[handle] || 0)}
                                                </Badge>
                                            )}
                                        </div>
                                        {state.handle === handle && (
                                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                                <Check className="h-4 w-4 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
