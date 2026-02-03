'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { StepProps, HANDLES, HANDLE_PRICES, KitConfigResponse } from '../types'
import { formatMXN } from '@/lib/utils'
import Image from 'next/image'

interface ExtendedStepProps extends StepProps {
    filterHandles?: string[]
    stepNumber?: number
    configData?: KitConfigResponse | null
}

export default function StepHandle({
    state,
    updateState,
    filterHandles,
    stepNumber = 9,
    configData
}: ExtendedStepProps) {
    const handleSelect = (handle: string) => {
        if (updateState) {
            updateState({ handle })
        }
    }

    const currentHandle = state?.handle

    // Use dynamic handles from configData if available, otherwise fallback
    const dynamicHandles = configData?.handles.map(h => ({
        name: h.name,
        price: Number(h.price),
        imageUrl: h.imageUrl
    })) || HANDLES.map(name => ({
        name,
        price: HANDLE_PRICES[name] || 0,
        imageUrl: null as string | null
    }))

    // Add "No aplica" if not present
    if (!dynamicHandles.some(h => h.name === 'No aplica')) {
        dynamicHandles.unshift({ name: 'No aplica', price: 0, imageUrl: null })
    }

    // Filter handles if prop provided
    let availableHandles = dynamicHandles
    if (filterHandles && filterHandles.length > 0) {
        availableHandles = dynamicHandles.filter(h => {
            if (h.name === 'No aplica') return true
            return filterHandles.some(keyword => h.name.includes(keyword))
        })
    }

    const getHandleImage = (handle: { name: string, imageUrl?: string | null }) => {
        if (handle.name === 'No aplica') return null

        if (handle.imageUrl) return handle.imageUrl

        const name = handle.name

        // Check for Romo/Romulo handles
        if (name.includes('Romo') || name.includes('Romulo')) {
            const handleName = name.split(' ')[0].toLowerCase()
            return `/images/handles/${handleName}.png`
        }

        // Check for Remo handles
        if (name.includes('Remo')) {
            const handleName = name.split(' ')[0].toLowerCase()
            return `/images/handles/${handleName}.png`
        }

        // Sorento handles
        const model = name.split(' ')[1]?.toLowerCase()
        if (model) {
            return `/images/handles/sorento-${model}.png`
        }

        return null
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Paso {stepNumber}: Jaladera</h2>
                <p className="text-muted-foreground">Selecciona el tipo de jaladera</p>
            </div>

            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableHandles.map((handle) => (
                        <Card
                            key={handle.name}
                            className={`cursor-pointer transition-all hover:shadow-lg ${currentHandle === handle.name ? 'border-primary ring-2 ring-primary' : ''
                                }`}
                            onClick={() => handleSelect(handle.name)}
                        >
                            <CardContent className="p-0">
                                {getHandleImage(handle) && (
                                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-white">
                                        <Image
                                            src={getHandleImage(handle)!}
                                            alt={handle.name}
                                            fill
                                            className="object-contain p-4 transition-transform hover:scale-105"
                                        />
                                    </div>
                                )}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm">{handle.name}</p>
                                            {handle.name !== 'No aplica' && (
                                                <Badge variant="secondary" className="text-xs w-fit">
                                                    {formatMXN(handle.price)}
                                                </Badge>
                                            )}
                                        </div>
                                        {currentHandle === handle.name && (
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
