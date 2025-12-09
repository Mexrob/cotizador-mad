'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { WizardState, DIMENSION_LIMITS, TONE_PRICES, HANDLE_PRICES } from './types'
import StepCategory from './steps/StepCategory'
import StepLine from './steps/StepLine'
import StepDimensions from './steps/StepDimensions'
import StepTone from './steps/StepTone'
import StepColor from './steps/StepColor'
import StepBackFace from './steps/StepBackFace'
import StepEdgeBanding from './steps/StepEdgeBanding'
import StepOptionals from './steps/StepOptionals'
import StepHandle from './steps/StepHandle'
import StepSummary from './steps/StepSummary'

interface KitWizardProps {
    onComplete: (config: WizardState) => void
    onCancel: () => void
    initialState?: WizardState
}

const TOTAL_STEPS = 10

export default function KitWizard({ onComplete, onCancel, initialState }: KitWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [state, setState] = useState<WizardState>(initialState || {
        category: null,
        line: null,
        dimensions: { width: 0, height: 0, quantity: 1 },
        frontDimensions: { width: 0, height: 0 },
        tone: null,
        backFace: null,
        edgeBanding: null,
        optionals: { isExhibition: false, isExpressDelivery: false },
        handle: null,
        pricing: {
            basePrice: 0,
            handlePrice: 0,
            exhibitionFee: 0,
            expressDeliveryFee: 0,
            subtotal: 0,
            total: 0,
            pricePerSquareMeter: 0,
        },
        deliveryDays: 0,
        color: null,
    })

    const updateState = (updates: Partial<WizardState>) => {
        setState((prev) => {
            const newState = { ...prev, ...updates }

            // Update delivery days based on line
            if (updates.line !== undefined) {
                newState.deliveryDays = updates.line === 'Cerámica' ? 20 : 0
            }

            return newState
        })
    }

    // Calculate pricing whenever relevant state changes
    useEffect(() => {
        calculatePricing()
    }, [
        state.dimensions,
        state.tone,
        state.handle,
        state.optionals,
    ])

    const calculatePricing = () => {
        // Get base price from selected tone (price per m²)
        const tonePrice = state.tone ? TONE_PRICES[state.tone] || 0 : 0

        // Calculate area in square meters
        const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)

        // Base price = area (m²) × price per m² × quantity
        const basePrice = area * tonePrice * state.dimensions.quantity

        // Handle price - get from HANDLE_PRICES
        let handlePrice = 0
        if (state.handle && state.handle !== 'No aplica') {
            const unitHandlePrice = HANDLE_PRICES[state.handle] || 0
            handlePrice = unitHandlePrice * state.dimensions.quantity
        }

        // Optional fees
        const exhibitionFee = state.optionals.isExhibition ? 500 : 0
        const expressDeliveryFee = state.optionals.isExpressDelivery ? 500 : 0

        const subtotal = basePrice + handlePrice
        const total = subtotal + exhibitionFee + expressDeliveryFee

        updateState({
            pricing: {
                basePrice,
                handlePrice,
                exhibitionFee,
                expressDeliveryFee,
                subtotal,
                total,
                pricePerSquareMeter: tonePrice, // Guardar el precio por m² del tono seleccionado
            },
        })
    }

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return state.category !== null
            case 2:
                return state.line !== null
            case 3: {
                // Get limits based on selected line
                const limits = state.line === 'Cerámica' ? DIMENSION_LIMITS.ceramica : DIMENSION_LIMITS.vidrio
                return (
                    state.dimensions.width >= limits.width.min &&
                    state.dimensions.width <= limits.width.max &&
                    state.dimensions.height >= limits.height.min &&
                    state.dimensions.height <= limits.height.max &&
                    state.dimensions.quantity >= 1
                )
            }
            case 4:
                return state.tone !== null
            case 5:
                // Color is only required for Cerámica line
                if (state.line === 'Cerámica') {
                    return state.color !== null
                }
                // For Vidrio, this is the backFace step
                return state.backFace !== null
            case 6:
                return state.backFace !== null
            case 7:
                return state.edgeBanding !== null
            case 8:
                return true // Optionals are optional
            case 9:
                return state.handle !== null
            case 10:
                return true // Summary step
            default:
                return false
        }
    }

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS && validateStep(currentStep)) {
            let nextStep = currentStep + 1
            // Skip step 5 (color) for Vidrio line
            if (currentStep === 4 && state.line === 'Vidrio') {
                nextStep = 6 // Skip to step 6 (BackFace)
            }
            setCurrentStep(nextStep)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            let prevStep = currentStep - 1
            // Skip step 5 (color) when going back from step 6 if Vidrio
            if (currentStep === 6 && state.line === 'Vidrio') {
                prevStep = 4 // Go back to step 4 (Tone)
            }
            setCurrentStep(prevStep)
        }
    }

    const handleComplete = () => {
        if (validateStep(currentStep)) {
            onComplete(state)
        }
    }

    const renderStep = () => {
        const stepProps = {
            state,
            updateState,
            onNext: handleNext,
            onBack: handleBack,
            isValid: validateStep(currentStep),
        }

        switch (currentStep) {
            case 1:
                return <StepCategory {...stepProps} />
            case 2:
                return <StepLine {...stepProps} />
            case 3:
                return <StepDimensions {...stepProps} />
            case 4:
                return <StepTone {...stepProps} />
            case 5:
                // Only show color step for Cerámica line
                return <StepColor {...stepProps} />
            case 6:
                return <StepBackFace {...stepProps} />
            case 7:
                return <StepEdgeBanding {...stepProps} />
            case 8:
                return <StepOptionals {...stepProps} />
            case 9:
                return <StepHandle {...stepProps} />
            case 10:
                return <StepSummary {...stepProps} />
            default:
                return null
        }
    }

    const progress = (currentStep / TOTAL_STEPS) * 100

    return (
        <div className="w-full h-full flex flex-col">
            {/* Progress Bar */}
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                            Paso {currentStep} de {TOTAL_STEPS}
                        </span>
                        <span className="text-muted-foreground">{Math.round(progress)}% completado</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>
            </div>

            {/* Step Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="sticky bottom-0 bg-background border-t px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                    <Button
                        variant="outline"
                        onClick={currentStep === 1 ? onCancel : handleBack}
                        className="min-w-[120px]"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                    </Button>

                    {currentStep < TOTAL_STEPS ? (
                        <Button
                            onClick={handleNext}
                            disabled={!validateStep(currentStep)}
                            className="min-w-[120px]"
                        >
                            Siguiente
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={!validateStep(currentStep)}
                            className="min-w-[120px]"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            Agregar a Cotización
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
