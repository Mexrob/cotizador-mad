'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ChevronLeft, ChevronRight, Check, Loader2 } from 'lucide-react'
import { KitConfigResponse, DBProductLine, DBHandleModel, WizardState, DIMENSION_LIMITS, TONE_PRICES, HANDLE_PRICES } from './types'
import StepCategory from './steps/StepCategory'
import StepLine from './steps/StepLine'
import StepDimensions from './steps/StepDimensions'
import StepTone from './steps/StepTone'
import StepColor from './steps/StepColor'
import StepBackFace from './steps/StepBackFace'
import StepEdgeBanding from './steps/StepEdgeBanding'
import StepAluminum from './steps/StepAluminum'
import StepGlassTone, { GLASS_FALLBACK } from './steps/StepGlassTone'
import StepEuropeaTone, { EUROPEA_FALLBACK } from "./steps/StepEuropeaTone"
import StepEuropeaSincroTone, { EUROPEA_SINCRO_FALLBACK } from "./steps/StepEuropeaSincroTone"
import StepAltoBrilloTone, { ALTO_BRILLO_FALLBACK } from "./steps/StepAltoBrilloTone"
import StepSuperMateTone, { SUPER_MATE_FALLBACK } from "./steps/StepSuperMateTone"
import StepGrain from "./steps/StepGrain"
import StepOptionals from './steps/StepOptionals'
import StepHandle from './steps/StepHandle'
import StepSummary from './steps/StepSummary'

interface KitWizardProps {
    onComplete: (config: WizardState) => void
    onCancel: () => void
    initialState?: WizardState
}

const TOTAL_STEPS = 10

const getLineSteps = (line: string | null): number[] => {
    switch (line) {
        case 'Vidrio':
            return [1, 2, 3, 4, 6, 7, 8, 9, 10]
        case 'Línea Alhú':
            return [1, 2, 3, 4, 5, 8, 9, 10]
        case 'Europea Básica':
        case 'Europea Sincro':
            return [1, 2, 3, 4, 5, 7, 8, 9, 10]
        case 'Alto Brillo':
        case 'Super Mate':
            return [1, 2, 3, 4, 7, 8, 9, 10]
        case 'Cerámica':
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        default:
            return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }
}

export default function KitWizard({ onComplete, onCancel, initialState }: KitWizardProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [loadingConfig, setLoadingConfig] = useState(true)
    const [configData, setConfigData] = useState<KitConfigResponse | null>(null)
    const [state, setState] = useState<WizardState>(initialState || {
        category: null,
        line: null,
        dimensions: { width: 0, height: 0, quantity: 1 },
        frontDimensions: { width: 0, height: 0 },
        tone: null,
        backFace: null,
        edgeBanding: null,
        optionals: { isExhibition: false, isExpressDelivery: false, isTwoFaces: false },
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

    const updateState = useCallback((updates: Partial<WizardState>) => {
        setState((prev) => {
            const newState = { ...prev, ...updates }

            // Update delivery days based on line
            if (updates.line !== undefined) {
                newState.deliveryDays = updates.line === 'Cerámica' ? 20 : 0
                if (updates.line === 'Alto Brillo') newState.deliveryDays = 7
            }

            // Reset color if tone changes (for Cerámica line)
            if (updates.tone !== undefined && updates.tone !== prev.tone) {
                if (newState.line === 'Cerámica') {
                    newState.color = null
                }
            }

            return newState
        })
    }, [])


    const calculatePricing = useCallback(() => {
        // Get base price from selected tone (price per m²)
        let tonePrice = 0
        let twoCarsAdjustment = 0

        if (state.tone && configData) {
            // Priority: Dynamic pricing from DB
            const line = configData.lines.find(l => l.name === state.line)
            const tone = line?.tones.find(t => t.name === state.tone)

            if (tone) {
                tonePrice = Number(tone.priceAdjustment)
                twoCarsAdjustment = Number(tone.twoCarsAdjustment || 0)
            } else {
                // Fallback to static constants if not found in DB
                tonePrice = TONE_PRICES[state.tone] || 0
            }
        } else if (state.tone) {
            // Fallback for static constants (while loading or if tone is not in DB)
            tonePrice = TONE_PRICES[state.tone] || 0
        }

        // Calculate area in square meters
        const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)

        // Apply two faces adjustment if selected
        const effectiveTonePrice = state.optionals.isTwoFaces ? (tonePrice + twoCarsAdjustment) : tonePrice

        // Base price = area (m²) × price per m² × quantity
        const basePrice = area * effectiveTonePrice * state.dimensions.quantity

        // Handle price - get from dynamic config or HANDLE_PRICES
        let handlePrice = 0
        if (state.handle && state.handle !== 'No aplica') {
            let unitHandlePrice = 0
            if (configData && configData.handles) {
                const handle = configData.handles.find(h => h.name === state.handle)
                unitHandlePrice = handle ? Number(handle.price) : (HANDLE_PRICES[state.handle] || 0)
            } else {
                unitHandlePrice = HANDLE_PRICES[state.handle] || 0
            }
            handlePrice = unitHandlePrice * state.dimensions.quantity
        }

        // Back face fee (dynamic or fallback)
        let backFaceFee = 0
        if (state.backFace && configData?.backFaces) {
            const face = configData.backFaces.find(f => f.name === state.backFace)
            backFaceFee = face ? Number(face.priceAdjustment) : (state.backFace === 'Especialidad' ? 100 : 0)
        } else if (state.backFace === 'Especialidad') {
            backFaceFee = 100
        }

        // Subtotal now includes the back face fee for percentage calculations
        const subtotal = basePrice + handlePrice + backFaceFee

        // Optional fees (percentages based on subtotal)
        const exhibitionFee = state.optionals.isExhibition ? subtotal * -0.25 : 0
        const expressDeliveryFee = state.optionals.isExpressDelivery ? subtotal * 0.20 : 0

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
    }, [state.dimensions, state.tone, state.handle, state.optionals, state.backFace, state.line, updateState])

    // Calculate pricing whenever relevant state changes
    useEffect(() => {
        calculatePricing()
    }, [calculatePricing])

    // Load dynamic configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                setLoadingConfig(true)
                const response = await fetch('/api/kit-config')
                if (response.ok) {
                    const json = await response.json()
                    if (json.success) {
                        setConfigData(json.data)
                    }
                }
            } catch (error) {
                console.error('Error fetching kit config:', error)
            } finally {
                setLoadingConfig(false)
            }
        }
        fetchConfig()
    }, [])


    // Alhú-specific pricing logic
    useEffect(() => {
        if (state.line === 'Línea Alhú') {
            let ALHU_GLASS_PRICE = 4440
            if (configData) {
                const line = configData.lines.find(l => l.name === 'Línea Alhú')
                // For Alhu, the price is usually base for the line or a specific tone
                // Trying to find if there's a specific tone selected, otherwise use fallback
                const tone = line?.tones.find(t => t.name === state.tone)
                if (tone) ALHU_GLASS_PRICE = Number(tone.priceAdjustment)
            }
            const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)
            // Apply two faces adjustment if selected
            let twoCarsAdjustment = 0
            if (state.optionals.isTwoFaces && configData) {
                const line = configData.lines.find(l => l.name === 'Línea Alhú')
                const tone = line?.tones.find(t => t.name === state.tone)
                twoCarsAdjustment = Number(tone?.twoCarsAdjustment || 0)
            }

            const effectivePrice = state.optionals.isTwoFaces ? (ALHU_GLASS_PRICE + twoCarsAdjustment) : ALHU_GLASS_PRICE
            const basePrice = area * effectivePrice * state.dimensions.quantity

            // Handle price
            let handlePrice = 0
            if (state.handle && state.handle !== 'No aplica') {
                let unitHandlePrice = 0
                if (configData) {
                    const handle = configData.handles.find(h => h.name === state.handle)
                    unitHandlePrice = handle ? Number(handle.price) : (HANDLE_PRICES[state.handle] || 0)
                } else {
                    unitHandlePrice = HANDLE_PRICES[state.handle] || 0
                }
                handlePrice = unitHandlePrice * state.dimensions.quantity
            }

            const subtotal = basePrice + handlePrice
            const exhibitionFee = state.optionals.isExhibition ? subtotal * -0.25 : 0
            const expressDeliveryFee = state.optionals.isExpressDelivery ? subtotal * 0.20 : 0
            const total = subtotal + exhibitionFee + expressDeliveryFee

            updateState({
                pricing: {
                    basePrice,
                    handlePrice,
                    exhibitionFee,
                    expressDeliveryFee,
                    subtotal,
                    total,
                    pricePerSquareMeter: ALHU_GLASS_PRICE,
                },
                deliveryDays: 20,
            })
        }
    }, [state.dimensions, state.line, state.optionals, state.tone, state.handle, state.edgeBanding])

    // Europea Básica-specific pricing logic
    useEffect(() => {
        if (state.line === 'Europea Básica') {
            let EUROPEA_PRICE = 977
            if (configData) {
                const line = configData.lines.find(l => l.name === 'Europea Básica')
                const tone = line?.tones.find(t => t.name === state.tone)
                if (tone) EUROPEA_PRICE = Number(tone.priceAdjustment)
            }
            const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)
            // Apply two faces adjustment if selected
            let twoCarsAdjustment = 0
            if (state.optionals.isTwoFaces && configData) {
                const line = configData.lines.find(l => l.name === 'Europea Básica')
                const tone = line?.tones.find(t => t.name === state.tone)
                twoCarsAdjustment = Number(tone?.twoCarsAdjustment || 0)
            }

            const effectivePrice = state.optionals.isTwoFaces ? (EUROPEA_PRICE + twoCarsAdjustment) : EUROPEA_PRICE
            const basePrice = area * effectivePrice * state.dimensions.quantity

            // Handle price
            let handlePrice = 0
            if (state.handle && state.handle !== 'No aplica') {
                let unitHandlePrice = 0
                if (configData) {
                    const handle = configData.handles.find(h => h.name === state.handle)
                    unitHandlePrice = handle ? Number(handle.price) : (HANDLE_PRICES[state.handle] || 0)
                } else {
                    unitHandlePrice = HANDLE_PRICES[state.handle] || 0
                }
                handlePrice = unitHandlePrice * state.dimensions.quantity
            }

            const subtotal = basePrice + handlePrice
            const exhibitionFee = state.optionals.isExhibition ? subtotal * -0.25 : 0
            const expressDeliveryFee = state.optionals.isExpressDelivery ? subtotal * 0.20 : 0
            const total = subtotal + exhibitionFee + expressDeliveryFee

            updateState({
                pricing: {
                    basePrice,
                    handlePrice,
                    exhibitionFee,
                    expressDeliveryFee,
                    subtotal,
                    total,
                    pricePerSquareMeter: EUROPEA_PRICE,
                },
                deliveryDays: 7,
            })
        }
    }, [state.dimensions, state.line, state.optionals, state.handle])

    // Auto-set edge banding for Europea Básica
    useEffect(() => {
        if (state.line === 'Europea Básica' && !state.edgeBanding) {
            updateState({ edgeBanding: 'Mismo tono de puerta' })
        }
    }, [state.line])

    // Europea Sincro-specific pricing logic
    useEffect(() => {
        if (state.line === 'Europea Sincro') {
            let SINCRO_PRICE = 1400
            if (configData) {
                const line = configData.lines.find(l => l.name === 'Europea Sincro')
                const tone = line?.tones.find(t => t.name === state.tone)
                if (tone) SINCRO_PRICE = Number(tone.priceAdjustment)
            }
            const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)
            // Apply two faces adjustment if selected
            let twoCarsAdjustment = 0
            if (state.optionals.isTwoFaces && configData) {
                const line = configData.lines.find(l => l.name === 'Europea Sincro')
                const tone = line?.tones.find(t => t.name === state.tone)
                twoCarsAdjustment = Number(tone?.twoCarsAdjustment || 0)
            }

            const effectivePrice = state.optionals.isTwoFaces ? (SINCRO_PRICE + twoCarsAdjustment) : SINCRO_PRICE
            const basePrice = area * effectivePrice * state.dimensions.quantity

            // Handle price
            let handlePrice = 0
            if (state.handle && state.handle !== 'No aplica') {
                let unitHandlePrice = 0
                if (configData) {
                    const handle = configData.handles.find(h => h.name === state.handle)
                    unitHandlePrice = handle ? Number(handle.price) : (HANDLE_PRICES[state.handle] || 0)
                } else {
                    unitHandlePrice = HANDLE_PRICES[state.handle] || 0
                }
                handlePrice = unitHandlePrice * state.dimensions.quantity
            }

            const subtotal = basePrice + handlePrice
            const exhibitionFee = state.optionals.isExhibition ? subtotal * -0.25 : 0
            const expressDeliveryFee = state.optionals.isExpressDelivery ? subtotal * 0.20 : 0
            const total = subtotal + exhibitionFee + expressDeliveryFee

            updateState({
                pricing: {
                    basePrice,
                    handlePrice,
                    exhibitionFee,
                    expressDeliveryFee,
                    subtotal,
                    total,
                    pricePerSquareMeter: SINCRO_PRICE,
                },
                deliveryDays: 7,
            })
        }
    }, [state.dimensions, state.line, state.optionals, state.handle])

    // Auto-set edge banding for Europea Sincro
    useEffect(() => {
        if (state.line === 'Europea Sincro' && !state.edgeBanding) {
            updateState({ edgeBanding: 'Mismo tono de puerta' })
        }
    }, [state.line])

    // Alto Brillo-specific pricing logic and auto-set edge banding
    useEffect(() => {
        if (state.line === 'Alto Brillo') {
            let pricePerM2 = 0
            if (configData) {
                const line = configData.lines.find(l => l.name === 'Alto Brillo')
                const tone = line?.tones.find(t => t.name === state.tone)
                if (tone) pricePerM2 = Number(tone.priceAdjustment)
            }

            // Fallback to static if not found in DB
            if (pricePerM2 === 0) {
                const selectedTone = ALTO_BRILLO_FALLBACK.find((t: { name: string; price: number }) => t.name === state.tone)
                pricePerM2 = selectedTone ? selectedTone.price : 0
            }

            const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)
            // Apply two faces adjustment if selected
            let twoCarsAdjustment = 0
            if (state.optionals.isTwoFaces && configData) {
                const line = configData.lines.find(l => l.name === 'Alto Brillo')
                const tone = line?.tones.find(t => t.name === state.tone)
                twoCarsAdjustment = Number(tone?.twoCarsAdjustment || 0)
            }

            const effectivePrice = state.optionals.isTwoFaces ? (pricePerM2 + twoCarsAdjustment) : pricePerM2
            const basePrice = area * effectivePrice * state.dimensions.quantity

            let handlePrice = 0
            if (state.handle && state.handle !== 'No aplica') {
                const unitHandlePrice = HANDLE_PRICES[state.handle] || 0
                handlePrice = unitHandlePrice * state.dimensions.quantity
            }

            const subtotal = basePrice + handlePrice
            const exhibitionFee = state.optionals.isExhibition ? subtotal * -0.25 : 0
            const expressDeliveryFee = state.optionals.isExpressDelivery ? subtotal * 0.20 : 0
            const total = subtotal + exhibitionFee + expressDeliveryFee

            updateState({
                pricing: {
                    basePrice,
                    handlePrice,
                    exhibitionFee,
                    expressDeliveryFee,
                    subtotal,
                    total,
                    pricePerSquareMeter: pricePerM2,
                },
                deliveryDays: 7,
                edgeBanding: 'Mismo tono de puerta'
            })
        }
    }, [state.dimensions, state.line, state.optionals, state.tone, state.handle])

    // Super Mate-specific pricing logic and auto-set edge banding
    useEffect(() => {
        if (state.line === 'Super Mate') {
            let pricePerM2 = 0
            if (configData) {
                const line = configData.lines.find(l => l.name === 'Super Mate')
                const tone = line?.tones.find(t => t.name === state.tone)
                if (tone) pricePerM2 = Number(tone.priceAdjustment)
            }

            // Fallback to static if not found in DB
            if (pricePerM2 === 0) {
                const selectedTone = SUPER_MATE_FALLBACK.find((t: { name: string; price: number }) => t.name === state.tone)
                pricePerM2 = selectedTone ? selectedTone.price : 0
            }

            const area = (state.dimensions.width / 1000) * (state.dimensions.height / 1000)
            // Apply two faces adjustment if selected
            let twoCarsAdjustment = 0
            if (state.optionals.isTwoFaces && configData) {
                const line = configData.lines.find(l => l.name === 'Super Mate')
                const tone = line?.tones.find(t => t.name === state.tone)
                twoCarsAdjustment = Number(tone?.twoCarsAdjustment || 0)
            }

            const effectivePrice = state.optionals.isTwoFaces ? (pricePerM2 + twoCarsAdjustment) : pricePerM2
            const basePrice = area * effectivePrice * state.dimensions.quantity

            let handlePrice = 0
            if (state.handle && state.handle !== 'No aplica') {
                const unitHandlePrice = HANDLE_PRICES[state.handle] || 0
                handlePrice = unitHandlePrice * state.dimensions.quantity
            }

            const subtotal = basePrice + handlePrice
            const exhibitionFee = state.optionals.isExhibition ? subtotal * -0.25 : 0
            const expressDeliveryFee = state.optionals.isExpressDelivery ? subtotal * 0.20 : 0
            const total = subtotal + exhibitionFee + expressDeliveryFee

            updateState({
                pricing: {
                    basePrice,
                    handlePrice,
                    exhibitionFee,
                    expressDeliveryFee,
                    subtotal,
                    total,
                    pricePerSquareMeter: pricePerM2,
                },
                deliveryDays: 7,
                edgeBanding: 'Mismo tono de puerta'
            })
        }
    }, [state.dimensions, state.line, state.optionals, state.tone, state.handle])


    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                return state.category !== null
            case 2:
                return state.line !== null
            case 3: {
                // Get limits based on selected line
                let limits: any = DIMENSION_LIMITS.vidrio
                if (state.line === 'Cerámica') limits = DIMENSION_LIMITS.ceramica
                if (state.line === 'Línea Alhú') limits = (DIMENSION_LIMITS as any).alhu
                if (state.line === 'Europea Básica') limits = (DIMENSION_LIMITS as any).europea
                if (state.line === 'Europea Sincro') limits = (DIMENSION_LIMITS as any).europea // Same limits as Básica
                if (state.line === 'Alto Brillo') limits = (DIMENSION_LIMITS as any).altoBrillo
                if (state.line === 'Super Mate') limits = (DIMENSION_LIMITS as any).superMate

                return (
                    state.dimensions.width >= limits.width.min &&
                    state.dimensions.width <= limits.width.max &&
                    state.dimensions.height >= limits.height.min &&
                    state.dimensions.height <= limits.height.max &&
                    state.dimensions.quantity >= 1
                )
            }
            case 4:
                // For Alhú, Step 4 is Aluminum Tone (stored in edgeBanding)
                if (state.line === 'Línea Alhú') return state.edgeBanding !== null
                // For Alto Brillo, Step 4 is Tone selection
                if (state.line === 'Alto Brillo') return state.tone !== null
                // For Super Mate, Step 4 is Tone selection
                if (state.line === 'Super Mate') return state.tone !== null
                return state.tone !== null
            case 5:
                // Color is only required for Cerámica line
                // For Alhú, Step 5 is Glass Tone (stored in tone)
                if (state.line === 'Línea Alhú') return state.tone !== null
                // For Europea Básica, Step 5 is Grain (stored in backFace)
                if (state.line === 'Europea Básica') return state.backFace !== null
                // For Europea Sincro, Step 5 is Grain (stored in backFace)
                if (state.line === 'Europea Sincro') return state.backFace !== null
                // For Alto Brillo, Step 5 (Grain) is skipped, so this validation should not be reached.
                // If it were reached, it would be true as it's skipped.
                if (state.line === 'Cerámica') {
                    return state.color !== null
                }
                // For Vidrio, this is the backFace step
                return state.backFace !== null
            case 6:
                // For Alto Brillo, Step 6 (Edge Banding) is auto-set, so this validation should not be reached.
                // If it were reached, it would be true as it's auto-set.
                // Same for Super Mate
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

            // Alhú Flow: 1->2->3->4->5->6->7->8
            // Step 4: Aluminum Tone, Step 5: Glass Tone
            // Skip steps 6 (BackFace), 7 (EdgeBanding) and go to 8 (Optionals)
            if (state.line === 'Línea Alhú') {
                if (currentStep === 5) nextStep = 8 // From Glass Tone to Optionals
                if (currentStep === 8) nextStep = 9 // From Optionals to Handle
            }

            // Europea Básica Flow: 1->2->3->4->5->6->7->8->9
            // Step 4: Tone, Step 5: Grain, Step 6: EdgeBanding
            // Skip BackFace (step 6 becomes EdgeBanding)
            if (state.line === 'Europea Básica') {
                // After Grain (5), go to EdgeBanding which we Map to step 7
                if (currentStep === 5) nextStep = 7 // From Grain to EdgeBanding
            }

            // Europea Sincro Flow: Same as Básica
            if (state.line === 'Europea Sincro') {
                if (currentStep === 5) nextStep = 7 // From Grain to EdgeBanding
            }

            // Alto Brillo Flow: 1->2->3->4->7->8->9
            // Skip Step 5 (Grain/Color) and Step 6 (BackFace)
            // Go directly to Step 7 (Edge Banding)
            if (state.line === 'Alto Brillo') {
                if (currentStep === 4) nextStep = 7 // From Tone to Edge Banding
            }

            // Super Mate Flow: 1->2->3->4->7->8->9
            // Skip Step 5 (Grain/Color) and Step 6 (BackFace)
            // Go directly to Step 7 (Edge Banding)
            if (state.line === 'Super Mate') {
                if (currentStep === 4) nextStep = 7 // From Tone to Edge Banding
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

            // Alhú Flow backwards
            if (state.line === 'Línea Alhú') {
                if (currentStep === 8) prevStep = 5 // From Optionals back to Glass Tone
                if (currentStep === 9) prevStep = 8 // From Handle back to Optionals
            }

            // Europea Básica Flow backwards
            if (state.line === 'Europea Básica') {
                if (currentStep === 7) prevStep = 5 // From EdgeBanding back to Grain
            }

            // Europea Sincro Flow backwards
            if (state.line === 'Europea Sincro') {
                if (currentStep === 7) prevStep = 5 // From EdgeBanding back to Grain
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
            configData,
            onNext: handleNext,
            onBack: handleBack,
            isValid: validateStep(currentStep),
            stepNumber: displayStep,
        }

        switch (currentStep) {
            case 1:
                return <StepCategory {...stepProps} />
            case 2:
                return <StepLine {...stepProps} />
            case 3:
                // For Alhú, pass custom dimension limits
                if (state.line === 'Línea Alhú') {
                    const limits = (DIMENSION_LIMITS as any).alhu
                    return <StepDimensions {...stepProps} limits={limits} />
                }
                // For Europea Básica, pass custom dimension limits
                if (state.line === 'Europea Básica') {
                    const limits = (DIMENSION_LIMITS as any).europea
                    return <StepDimensions {...stepProps} limits={limits} />
                }
                // For Europea Sincro, pass custom dimension limits
                if (state.line === 'Europea Sincro') {
                    const limits = (DIMENSION_LIMITS as any).europea
                    return <StepDimensions {...stepProps} limits={limits} />
                }
                // For Alto Brillo
                if (state.line === 'Alto Brillo') {
                    const limits = (DIMENSION_LIMITS as any).altoBrillo
                    return <StepDimensions {...stepProps} limits={limits} />
                }
                // For Super Mate
                if (state.line === 'Super Mate') {
                    const limits = (DIMENSION_LIMITS as any).superMate
                    return <StepDimensions {...stepProps} limits={limits} />
                }
                return <StepDimensions {...stepProps} />
            case 4:
                // For Alhú, Step 4 is Aluminum Tone
                if (state.line === 'Línea Alhú') {
                    return (
                        <StepAluminum
                            value={state.edgeBanding}
                            onChange={(val) => updateState({ edgeBanding: val as any })}
                            stepNumber={displayStep}
                        />
                    )
                }
                // For Europea Básica, Step 4 is Tone selection
                if (state.line === 'Europea Básica') {
                    return (
                        <StepEuropeaTone
                            value={state.tone}
                            onChange={(val) => updateState({ tone: val })}
                            stepNumber={displayStep}
                            configData={configData}
                        />
                    )
                }
                // For Europea Sincro, Step 4 is Sincro Tone selection
                if (state.line === 'Europea Sincro') {
                    return (
                        <StepEuropeaSincroTone
                            value={state.tone}
                            onChange={(val) => updateState({ tone: val })}
                            stepNumber={displayStep}
                            configData={configData}
                        />
                    )
                }
                // For Alto Brillo
                if (state.line === 'Alto Brillo') {
                    return (
                        <StepAltoBrilloTone
                            value={state.tone}
                            onChange={(val) => updateState({ tone: val })}
                            stepNumber={displayStep}
                            configData={configData}
                        />
                    )
                }
                // For Super Mate
                if (state.line === 'Super Mate') {
                    return (
                        <StepSuperMateTone
                            value={state.tone}
                            onChange={(val) => updateState({ tone: val })}
                            stepNumber={displayStep}
                            configData={configData}
                        />
                    )
                }
                return <StepTone {...stepProps} />
            case 5:
                // Only show color step for Cerámica line
                // For Alhú, Step 5 is Glass Tone
                if (state.line === 'Línea Alhú') {
                    return (
                        <StepGlassTone
                            value={state.tone}
                            onChange={(val) => updateState({ tone: val })}
                            stepNumber={displayStep}
                            configData={configData}
                        />
                    )
                }
                // For Europea Básica, Step 5 is Grain
                if (state.line === 'Europea Básica') {
                    return (
                        <StepGrain
                            value={state.backFace}
                            onChange={(val) => updateState({ backFace: val as any })}
                            stepNumber={displayStep}
                        />
                    )
                }
                // For Europea Sincro, Step 5 is Grain
                if (state.line === 'Europea Sincro') {
                    return (
                        <StepGrain
                            value={state.backFace}
                            onChange={(val) => updateState({ backFace: val as any })}
                            stepNumber={displayStep}
                        />
                    )
                }
                return <StepColor {...stepProps} />
            case 6:
                return <StepBackFace {...stepProps} />
            case 7:
                // For Europea Básica, show informational component (edge banding is auto-set)
                if (state.line === 'Europea Básica') {
                    return (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Paso {displayStep}: Cubrecanto</h2>
                                <p className="text-muted-foreground">Acabado del cubrecanto</p>
                            </div>
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
                                    <p className="text-lg font-semibold">Mismo tono de puerta</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        El cubrecanto será del mismo tono que seleccionaste para tu puerta
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }
                // For Europea Sincro, show informational component (edge banding is auto-set)
                if (state.line === 'Europea Sincro') {
                    return (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Paso {displayStep}: Cubrecanto</h2>
                                <p className="text-muted-foreground">Acabado del cubrecanto</p>
                            </div>
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
                                    <p className="text-lg font-semibold">Mismo tono de puerta</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        El cubrecanto será del mismo tono que seleccionaste para tu puerta
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }
                // For Super Mate, show informational component (edge banding is auto-set)
                if (state.line === 'Super Mate') {
                    return (
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <h2 className="text-2xl font-bold">Paso {displayStep}: Cubrecanto</h2>
                                <p className="text-muted-foreground">Acabado del cubrecanto</p>
                            </div>
                            <div className="max-w-2xl mx-auto">
                                <div className="bg-primary/10 border-2 border-primary rounded-lg p-6 text-center">
                                    <p className="text-lg font-semibold">Mismo tono de puerta</p>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        El cubrecanto será del mismo tono que seleccionaste para tu puerta
                                    </p>
                                </div>
                            </div>
                        </div>
                    )
                }
                return <StepEdgeBanding {...stepProps} configData={configData} />
            case 8:
                return <StepOptionals {...stepProps} />
            case 9:
                // Step 9: Handle
                if (state.line === 'Línea Alhú') {
                    return <StepHandle {...stepProps} filterHandles={['Romulo', 'Remo']} />
                }
                if (state.line === 'Europea Básica' || state.line === 'Europea Sincro' || state.line === 'Alto Brillo' || state.line === 'Super Mate') {
                    return <StepHandle {...stepProps} filterHandles={['Sorento']} />
                }
                return <StepHandle {...stepProps} />
            case 10:
                return <StepSummary {...stepProps} />
            default:
                return null
        }
    }




    const lineSteps = getLineSteps(state.line)
    const currentStepIndex = lineSteps.indexOf(currentStep)
    const displayStep = currentStepIndex !== -1 ? currentStepIndex + 1 : currentStep
    const totalDisplaySteps = lineSteps.length
    const progress = (displayStep / totalDisplaySteps) * 100

    if (loadingConfig) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Cargando configuración...</p>
            </div>
        )
    }

    return (
        <div className="w-full h-full flex flex-col">
            {/* Progress Bar */}
            <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                            Paso {displayStep} de {totalDisplaySteps}
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
