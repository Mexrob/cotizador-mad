'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import {
    ChevronRight,
    ChevronLeft,
    Check,
    Package,
    Palette,
    Settings,
    Grip,
    Ruler,
    ShoppingCart,
    Search,
} from 'lucide-react'

// Types for Product Configuration
interface ProductLine {
    id: string
    name: string
    code: string
    description?: string
    imageUrl?: string
    sortOrder: number
}

interface ProductTone {
    id: string
    name: string
    lineId: string
    hexColor?: string
    supportsTwoCars: boolean
    supportsHorizontalGrain: boolean
    supportsVerticalGrain: boolean
    priceAdjustment: number
    twoCarsAdjustment: number
    imageUrl?: string
}

interface HandleModel {
    id: string
    name: string
    model: string
    finish: string
    price: number
    imageUrl?: string
}

interface Product {
    id: string
    name: string
    sku: string
    thumbnail?: string
    basePrice: number
    width: number
    height: number
    depth: number
    minWidth?: number
    maxWidth?: number
    minHeight?: number
    maxHeight?: number
    isCustomizable: boolean
    lineId?: string
    category?: { name: string }
}

interface ConfigurationState {
    productId?: string
    lineId?: string
    toneId?: string
    cars: 1 | 2
    grain?: 'horizontal' | 'vertical'
    handleId?: string
    width: number
    height: number
    quantity: number
    isExhibition?: boolean
    isExpressDelivery?: boolean
}

interface PricingBreakdown {
    basePrice: number
    toneAdjustment: number
    carsAdjustment: number
    laborCost: number
    handlePrice: number
    exhibitionFee?: number
    expressDeliveryFee?: number
}

interface PricingCalculation {
    unitPrice: number
    totalPrice: number
    breakdown: PricingBreakdown
}

interface ProductConfiguratorProps {
    onComplete: (config: ConfigurationState & { unitPrice: number; totalPrice: number }) => void
    onCancel: () => void
    initialConfig?: Partial<ConfigurationState>
    mode?: 'create' | 'edit'
    allowedLines?: string[]
    allowedHandles?: string[]
    allowedTones?: string[]
}

const steps = [
    { id: 1, name: 'Producto', icon: Package },
    { id: 2, name: 'Línea', icon: Package },
    { id: 3, name: 'Tono', icon: Palette },
    { id: 4, name: 'Configuración', icon: Settings },
    { id: 5, name: 'Jaladera', icon: Grip },
    { id: 6, name: 'Dimensiones', icon: Ruler },
    { id: 7, name: 'Resumen', icon: ShoppingCart },
]

export default function ProductConfigurator({
    onComplete,
    onCancel,
    initialConfig,
    mode = 'create',
    allowedLines,
    allowedHandles,
    allowedTones,
}: ProductConfiguratorProps) {
    const [currentStep, setCurrentStep] = useState(1)
    const [products, setProducts] = useState<Product[]>([])
    const [productSearch, setProductSearch] = useState('')
    const [lines, setLines] = useState<ProductLine[]>([])
    const [tones, setTones] = useState<ProductTone[]>([])
    const [handles, setHandles] = useState<HandleModel[]>([])
    const [loading, setLoading] = useState(false)

    const [config, setConfig] = useState<ConfigurationState>({
        productId: initialConfig?.productId,
        lineId: initialConfig?.lineId,
        toneId: initialConfig?.toneId,
        cars: initialConfig?.cars || 1,
        grain: initialConfig?.grain,
        handleId: initialConfig?.handleId,
        width: initialConfig?.width ?? 700,
        height: initialConfig?.height ?? 2100,
        quantity: initialConfig?.quantity ?? 1,
        isExhibition: initialConfig?.isExhibition || false,
        isExpressDelivery: initialConfig?.isExpressDelivery || false,
    })

    // Fetch products and handles on mount
    useEffect(() => {
        fetchProducts()
        fetchLines()
        fetchHandles()
    }, [])

    // When product is selected, set default line and dimensions (only in create mode)
    useEffect(() => {
        if (mode === 'create' && config.productId && products.length > 0) {
            const selectedProduct = products.find(p => p.id === config.productId)
            if (selectedProduct) {
                setConfig(prev => ({
                    ...prev,
                    lineId: selectedProduct.lineId || prev.lineId,
                    width: selectedProduct.minWidth || selectedProduct.width || prev.width,
                    height: selectedProduct.minHeight || selectedProduct.height || prev.height,
                }))
            }
        }
    }, [config.productId, products, mode])

    // Fetch tones when line is selected
    useEffect(() => {
        if (config.lineId) {
            fetchTones(config.lineId)
        }
    }, [config.lineId])

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products?isCustomizable=true&limit=100')
            const data = await response.json()
            if (data.success) {
                // Filter out "Standard" products as requested
                const filteredProducts = data.data.filter((p: any) =>
                    !p.name.toLowerCase().includes('standard') &&
                    !p.name.toLowerCase().includes('estandard')
                )
                setProducts(filteredProducts)
            }
        } catch (error) {
            console.error('Error fetching products:', error)
        }
    }

    const fetchLines = async () => {
        try {
            const response = await fetch('/api/product-lines')
            const data = await response.json()
            if (data.success) {
                setLines(data.data)
            }
        } catch (error) {
            console.error('Error fetching lines:', error)
        }
    }

    const fetchTones = async (lineId: string) => {
        try {
            setLoading(true)
            const response = await fetch(`/api/product-lines/${lineId}/tones`)
            const data = await response.json()
            if (data.success) {
                setTones(data.data)
            }
        } catch (error) {
            console.error('Error fetching tones:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchHandles = async () => {
        try {
            const response = await fetch('/api/handles')
            const data = await response.json()
            if (data.success) {
                setHandles(data.data)
            }
        } catch (error) {
            console.error('Error fetching handles:', error)
        }
    }

    const selectedProduct = products.find((p) => p.id === config.productId)
    const selectedLine = lines.find((l) => l.id === config.lineId)
    const selectedTone = tones.find((t) => t.id === config.toneId)
    const selectedHandle = handles.find((h) => h.id === config.handleId)

    const isStepValid = (step: number) => {
        switch (step) {
            case 1:
                return !!config.productId
            case 2:
                return !!config.lineId
            case 3:
                return !!config.toneId
            case 4:
                return true // Cars is always selected
            case 5:
                return true // Handle is optional
            case 6:
                return config.width > 0 && config.height > 0 && config.quantity > 0
            default:
                return true
        }
    }

    const canProceed = () => {
        return isStepValid(currentStep)
    }

    const handleStepClick = (stepIndex: number) => {
        // Always allow going back
        if (stepIndex < currentStep) {
            setCurrentStep(stepIndex)
            return
        }

        // Allow going forward only if all previous steps are valid
        let canJump = true
        for (let i = 1; i < stepIndex; i++) {
            if (!isStepValid(i)) {
                canJump = false
                break
            }
        }

        if (canJump) {
            setCurrentStep(stepIndex)
        }
    }

    const handleNext = () => {
        if (canProceed() && currentStep < steps.length) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
        }
    }

    const calculatePrice = (): PricingCalculation => {
        // Pricing logic based on CSV data
        // Base price comes from Tone (priceAdjustment) which is per m²

        const widthM = config.width / 1000
        const heightM = config.height / 1000
        const areaM2 = widthM * heightM

        const tonePricePerM2 = Number(selectedTone?.priceAdjustment || 0)
        const basePriceTotal = areaM2 * tonePricePerM2

        // Cars adjustment (if applicable, currently 0 in CSV logic but supported in schema)
        const carsAdjustment =
            config.cars === 2 ? Number(selectedTone?.twoCarsAdjustment || 0) : 0

        const handlePrice = Number(selectedHandle?.price || 0)
        const laborCost = 0 // Not specified in CSV, setting to 0

        const exhibitionFee = config.isExhibition ? 500 : 0
        const expressDeliveryFee = config.isExpressDelivery ? 500 : 0

        const unitPrice = basePriceTotal + carsAdjustment + laborCost + handlePrice
        const totalPrice = unitPrice * config.quantity + exhibitionFee + expressDeliveryFee

        return {
            unitPrice,
            totalPrice,
            breakdown: {
                basePrice: basePriceTotal,
                toneAdjustment: 0, // Included in basePriceTotal
                carsAdjustment,
                laborCost,
                handlePrice,
                exhibitionFee,
                expressDeliveryFee,
            },
        }
    }

    const handleComplete = () => {
        const pricing = calculatePrice()
        onComplete({
            ...config,
            unitPrice: pricing.unitPrice,
            totalPrice: pricing.totalPrice,
        })
    }

    const progress = (currentStep / steps.length) * 100

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6">
            {/* Header with Steps */}
            <div className="space-y-6">
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Configurar Producto</h2>
                <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                    Sigue los pasos para configurar tu producto personalizado
                </p>



                {/* Steps Indicator */}
                <div className="mb-8">
                    <div className="flex items-start justify-between w-full">
                        {steps.map((step, index) => {
                            const stepNumber = index + 1
                            const isCompleted = stepNumber < currentStep
                            const isCurrent = stepNumber === currentStep

                            // Check if this step is reachable
                            let isReachable = true
                            for (let i = 1; i < stepNumber; i++) {
                                if (!isStepValid(i)) {
                                    isReachable = false
                                    break
                                }
                            }

                            return (
                                <div key={step.id} className="flex flex-1 last:flex-none">
                                    <div className="flex flex-col items-center relative z-10">
                                        <button
                                            onClick={() => handleStepClick(stepNumber)}
                                            disabled={!isReachable}
                                            className={`
                                            w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200
                                            ${isCurrent
                                                    ? 'bg-module-black text-white ring-4 ring-gray-100 dark:ring-gray-800 scale-110'
                                                    : isCompleted
                                                        ? 'bg-module-black text-white cursor-pointer hover:bg-module-dark'
                                                        : isReachable
                                                            ? 'bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400'
                                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                                }
                                        `}
                                        >
                                            {isCompleted ? (
                                                <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                            ) : (
                                                <step.icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                                            )}
                                        </button>
                                        <span
                                            className={`
                                            text-xs sm:text-sm mt-1 sm:mt-2 font-medium text-center max-w-[80px] sm:max-w-[100px]
                                            ${isCurrent ? 'text-module-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}
                                        `}
                                        >
                                            {step.name}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="flex-1 flex items-center h-8 sm:h-10 md:h-12 -ml-4 -mr-4">
                                            <div
                                                className={`
                                                h-0.5 sm:h-1 w-full mx-4 transition-all duration-200
                                                ${isCompleted ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}
                                            `}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Step Content */}
            <div className="h-[500px] sm:h-[600px] md:h-[700px] lg:h-[750px] w-full max-w-[900px] mx-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-full"
                    >
                        <Card className="flex flex-col w-full h-full">
                            <CardHeader className="pb-4 flex-none">
                                <CardTitle className="text-lg sm:text-xl">{steps[currentStep - 1].name}</CardTitle>
                                <CardDescription className="text-sm">
                                    {currentStep === 1 && 'Selecciona un producto personalizable del catálogo'}
                                    {currentStep === 2 && 'Selecciona la línea de producto'}
                                    {currentStep === 3 && 'Elige el tono o color'}
                                    {currentStep === 4 && 'Configura las opciones del producto'}
                                    {currentStep === 5 && 'Selecciona un modelo de jaladera (opcional)'}
                                    {currentStep === 6 && 'Define las dimensiones personalizadas'}
                                    {currentStep === 7 && 'Revisa tu configuración'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 pr-2 overflow-y-auto">
                                {/* Step content will be rendered here */}
                                {currentStep === 1 && (
                                    <StepProductSelection
                                        products={products}
                                        selected={config.productId}
                                        search={productSearch}
                                        onSearchChange={setProductSearch}
                                        onSelect={(id) => setConfig({ ...config, productId: id })}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <StepProductLine
                                        lines={allowedLines
                                            ? lines.filter(l => allowedLines.includes(l.name))
                                            : lines
                                        }
                                        selected={config.lineId}
                                        onSelect={(id) => setConfig({ ...config, lineId: id, toneId: undefined })}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <StepTone
                                        tones={allowedTones
                                            ? tones.filter(t => allowedTones.includes(t.name))
                                            : tones
                                        }
                                        selected={config.toneId}
                                        loading={loading}
                                        onSelect={(id) => setConfig({ ...config, toneId: id })}
                                    />
                                )}
                                {currentStep === 4 && (
                                    <StepConfiguration
                                        config={config}
                                        tone={selectedTone}
                                        onUpdate={(updates) => setConfig({ ...config, ...updates })}
                                    />
                                )}
                                {currentStep === 5 && (
                                    <StepHandle
                                        handles={allowedHandles
                                            ? handles.filter(h => allowedHandles.includes(h.name) || allowedHandles.includes(h.model))
                                            : handles
                                        }
                                        selected={config.handleId}
                                        onSelect={(id) => setConfig({ ...config, handleId: id })}
                                    />
                                )}
                                {currentStep === 6 && (
                                    <StepDimensions
                                        config={config}
                                        product={selectedProduct}
                                        onUpdate={(updates) => setConfig({ ...config, ...updates })}
                                    />
                                )}
                                {currentStep === 7 && (
                                    <StepSummary
                                        config={config}
                                        product={selectedProduct}
                                        line={selectedLine}
                                        tone={selectedTone}
                                        handle={selectedHandle}
                                        pricing={calculatePrice()}
                                    />
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Navigation Buttons */}
            <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t sm:border-t-0 pt-4 pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 sm:static flex flex-col sm:flex-row justify-between gap-3 mt-4 sm:mt-6 z-10">
                <Button
                    variant="outline"
                    onClick={currentStep === 1 ? onCancel : handleBack}
                    className="w-full sm:w-auto order-2 sm:order-1"
                >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {currentStep === 1 ? 'Cancelar' : 'Atrás'}
                </Button>

                {currentStep < steps.length ? (
                    <Button onClick={handleNext} disabled={!canProceed()} className="w-full sm:w-auto order-1 sm:order-2">
                        Siguiente
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto order-1 sm:order-2">
                        <Check className="w-4 h-4 mr-2" />
                        Agregar a Cotización
                    </Button>
                )}
            </div>
        </div>
    )
}

// Step Components

function StepProductSelection({
    products,
    selected,
    search,
    onSearchChange,
    onSelect,
}: {
    products: Product[]
    selected?: string
    search: string
    onSearchChange: (value: string) => void
    onSelect: (id: string) => void
}) {
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.sku.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Buscar producto por nombre o SKU..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-h-96 overflow-y-auto pr-2">
                {filteredProducts.map((product) => (
                    <Card
                        key={product.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selected === product.id
                            ? 'ring-2 ring-module-black bg-gray-50'
                            : 'hover:bg-gray-50'
                            }`}
                        onClick={() => onSelect(product.id)}
                    >
                        <CardContent className="p-4">
                            {product.thumbnail && (
                                <div className="relative w-full h-32 mb-3 rounded-md overflow-hidden">
                                    <Image
                                        src={product.thumbnail}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            )}
                            <h3 className="font-semibold text-sm mb-1">{product.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">SKU: {product.sku}</p>
                            {product.category && (
                                <p className="text-xs text-muted-foreground mb-2">{product.category.name}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Dimensión: {product.minWidth}-{product.maxWidth} × {product.minHeight}-{product.maxHeight} mm
                            </p>
                            {selected === product.id && (
                                <Badge className="mt-3 bg-green-600">Seleccionado</Badge>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    No se encontraron productos personalizables
                </div>
            )}
        </div>
    )
}

function StepProductLine({
    lines,
    selected,
    onSelect,
}: {
    lines: ProductLine[]
    selected?: string
    onSelect: (id: string) => void
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {lines.map((line) => (
                <Card
                    key={line.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${selected === line.id
                        ? 'ring-2 ring-module-black bg-gray-50'
                        : 'hover:bg-gray-50'
                        }`}
                    onClick={() => onSelect(line.id)}
                >
                    <CardContent className="p-4 sm:p-6">
                        {line.imageUrl && (
                            <div className="relative w-full h-32 mb-4 rounded-md overflow-hidden bg-white">
                                <Image
                                    src={line.imageUrl}
                                    alt={line.name}
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>
                        )}
                        <h3 className="font-semibold text-base sm:text-lg mb-2">{line.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground">{line.description}</p>
                        {selected === line.id && (
                            <Badge className="mt-4 bg-green-600">Seleccionado</Badge>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function StepTone({
    tones,
    selected,
    loading,
    onSelect,
}: {
    tones: ProductTone[]
    selected?: string
    loading: boolean
    onSelect: (id: string) => void
}) {
    if (loading) {
        return <div className="text-center py-12">Cargando tonos...</div>
    }

    if (tones.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                No hay tonos disponibles para esta línea
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {tones.map((tone) => (
                <Card
                    key={tone.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${selected === tone.id
                        ? 'ring-2 ring-module-black'
                        : 'hover:bg-gray-50'
                        }`}
                    onClick={() => onSelect(tone.id)}
                >
                    <CardContent className="p-3 sm:p-4">
                        {tone.imageUrl ? (
                            <div className="relative w-full h-16 sm:h-20 md:h-24 rounded-md mb-2 sm:mb-3 overflow-hidden bg-white">
                                <Image
                                    src={tone.imageUrl}
                                    alt={tone.name}
                                    fill
                                    className="object-contain p-1"
                                />
                            </div>
                        ) : tone.hexColor ? (
                            <div
                                className="w-full h-16 sm:h-20 md:h-24 rounded-md mb-2 sm:mb-3"
                                style={{ backgroundColor: tone.hexColor }}
                            />
                        ) : null}
                        <h4 className="font-medium text-xs sm:text-sm">{tone.name}</h4>
                        {selected === tone.id && (
                            <Check className="w-4 h-4 text-green-600 mt-2" />
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

function StepConfiguration({
    config,
    tone,
    onUpdate,
}: {
    config: ConfigurationState
    tone?: ProductTone
    onUpdate: (updates: Partial<ConfigurationState>) => void
}) {
    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Número de Caras</h4>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                        variant={config.cars === 1 ? 'default' : 'outline'}
                        onClick={() => onUpdate({ cars: 1 })}
                        className="flex-1"
                    >
                        1 Cara
                    </Button>
                    <Button
                        variant={config.cars === 2 ? 'default' : 'outline'}
                        onClick={() => onUpdate({ cars: 2 })}
                        disabled={!tone?.supportsTwoCars}
                        className="flex-1"
                    >
                        2 Caras
                        {!tone?.supportsTwoCars && (
                            <span className="ml-2 text-xs">(No disponible)</span>
                        )}
                    </Button>
                </div>
            </div>

            <div>
                <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Cubrecanto</h4>
                <div className="p-3 border rounded-md bg-gray-50 text-sm text-gray-700">
                    SIMILAR A TONO DEL VIDRIO
                </div>
            </div>

            {(tone?.supportsHorizontalGrain || tone?.supportsVerticalGrain) && (
                <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Orientación de Veta</h4>
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {tone.supportsHorizontalGrain && (
                            <Button
                                variant={config.grain === 'horizontal' ? 'default' : 'outline'}
                                onClick={() => onUpdate({ grain: 'horizontal' })}
                                className="flex-1"
                            >
                                Horizontal
                            </Button>
                        )}
                        {tone.supportsVerticalGrain && (
                            <Button
                                variant={config.grain === 'vertical' ? 'default' : 'outline'}
                                onClick={() => onUpdate({ grain: 'vertical' })}
                                className="flex-1"
                            >
                                Vertical
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <div>
                <h4 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Opciones Adicionales</h4>
                <div className="space-y-3">
                    <div
                        className={`p-3 border rounded-md cursor-pointer transition-all ${config.isExhibition ? 'bg-module-black text-white border-module-black' : 'hover:bg-gray-50'
                            }`}
                        onClick={() => onUpdate({ isExhibition: !config.isExhibition })}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Producto de Exhibición</span>
                                <Badge variant={config.isExhibition ? "outline" : "secondary"} className={config.isExhibition ? "border-white text-white" : ""}>
                                    +$500 MXN
                                </Badge>
                            </div>
                            {config.isExhibition && <Check className="w-4 h-4" />}
                        </div>
                    </div>
                    <div
                        className={`p-3 border rounded-md cursor-pointer transition-all ${config.isExpressDelivery ? 'bg-module-black text-white border-module-black' : 'hover:bg-gray-50'
                            }`}
                        onClick={() => onUpdate({ isExpressDelivery: !config.isExpressDelivery })}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">Entrega Express</span>
                                <Badge variant={config.isExpressDelivery ? "outline" : "secondary"} className={config.isExpressDelivery ? "border-white text-white" : ""}>
                                    +$500 MXN
                                </Badge>
                            </div>
                            {config.isExpressDelivery && <Check className="w-4 h-4" />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StepHandle({
    handles,
    selected,
    onSelect,
}: {
    handles: HandleModel[]
    selected?: string
    onSelect: (id?: string) => void
}) {
    return (
        <div className="space-y-4">
            <Button
                variant={!selected ? 'default' : 'outline'}
                onClick={() => onSelect(undefined)}
                className="w-full"
            >
                Sin Jaladera
            </Button>

            <Separator />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {handles.map((handle) => (
                    <Card
                        key={handle.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selected === handle.id
                            ? 'ring-2 ring-module-black bg-gray-50'
                            : 'hover:bg-gray-50'
                            }`}
                        onClick={() => onSelect(handle.id)}
                    >
                        <CardContent className="p-3 sm:p-4">
                            {handle.imageUrl && (
                                <div className="relative w-full h-24 sm:h-28 md:h-32 rounded-md mb-3 overflow-hidden bg-white">
                                    <Image
                                        src={handle.imageUrl}
                                        alt={handle.model}
                                        fill
                                        className="object-contain p-2"
                                    />
                                </div>
                            )}
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-medium text-sm mb-1">{handle.model}</h4>
                                    <p className="text-xs text-muted-foreground">{handle.finish}</p>
                                </div>
                                <Badge variant="secondary">${Number(handle.price).toFixed(2)}</Badge>
                            </div>
                            {selected === handle.id && (
                                <Check className="w-4 h-4 text-green-600 mt-2" />
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}

function StepDimensions({
    config,
    product,
    onUpdate,
}: {
    config: ConfigurationState
    product?: Product
    onUpdate: (updates: Partial<ConfigurationState>) => void
}) {
    // Need access to products to get min/max limits
    // Since we don't have products passed here, we need to pass them or use a context/store
    // For now, let's assume the parent component passes the selected product limits or we change the props
    // But StepDimensions is used in the render loop where products are available in scope?
    // No, StepDimensions is a separate function.
    // I need to update the signature of StepDimensions to accept 'products' or 'selectedProduct'
    // Let's check the call site.
    return (
        <div className="space-y-6">
            <p className="text-muted-foreground mb-4">
                Configure las dimensiones personalizadas para su producto
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Width */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Ancho (mm)</label>
                    <input
                        type="number"
                        value={config.width}
                        onChange={(e) => onUpdate({ width: Number(e.target.value) })}
                        min={product?.minWidth || 300}
                        max={product?.maxWidth || 1500}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground">
                        Rango: {product?.minWidth || 300} - {product?.maxWidth || 1500} mm
                    </p>
                </div>

                {/* Height */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Alto (mm)</label>
                    <input
                        type="number"
                        value={config.height}
                        onChange={(e) => onUpdate({ height: Number(e.target.value) })}
                        min={product?.minHeight || 500}
                        max={product?.maxHeight || 2400}
                        className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground">
                        Rango: {product?.minHeight || 500} - {product?.maxHeight || 2400} mm
                    </p>
                </div>

                {/* Quantity */}
                <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Cantidad</label>
                    <input
                        type="number"
                        value={config.quantity}
                        onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
                        min="1"
                        max="100"
                        className="w-full px-3 py-2 border rounded-md"
                    />
                    <p className="text-xs text-muted-foreground">Máximo: 100 unidades</p>
                </div>
            </div>

            {/* Size warning */}
            {(config.width > 1500 || config.height > 1500) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        ⚠️ <strong>Nota importante:</strong> Productos con dimensiones mayores a 1500 mm NO aplican garantía
                    </p>
                </div>
            )}
        </div>
    )
}

function StepSummary({
    config,
    product,
    line,
    tone,
    handle,
    pricing,
}: {
    config: ConfigurationState
    product?: Product
    line?: ProductLine
    tone?: ProductTone
    handle?: HandleModel
    pricing: PricingCalculation
}) {
    const area = (config.width * config.height) / 1_000_000 // m²

    return (
        <div className="space-y-6">
            <div className="text-center mb-6">
                <h3 className="font-semibold text-2xl mb-2">Resumen de Configuración</h3>
                <p className="text-muted-foreground">Revisa los detalles antes de agregar a la cotización</p>
            </div>

            {/* Product Details Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detalles del Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {product && (
                        <div className="mb-4 pb-4 border-b">
                            <p className="text-sm text-muted-foreground">Producto Base</p>
                            <p className="font-medium text-lg">{product.name}</p>
                            <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Línea de Producto</p>
                            <p className="font-medium">{line?.name}</p>
                            {line?.code && (
                                <p className="text-xs text-muted-foreground">Código: {line.code}</p>
                            )}
                        </div>

                        <div>
                            <p className="text-sm text-muted-foreground">Tono/Color</p>
                            <div className="flex items-center gap-2">
                                {tone?.hexColor && (
                                    <div
                                        className="w-6 h-6 rounded border border-gray-300"
                                        style={{ backgroundColor: tone.hexColor }}
                                    />
                                )}
                                <p className="font-medium">{tone?.name}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Configuración de Caras</p>
                            <p className="font-medium">{config.cars} {config.cars === 1 ? 'Cara' : 'Caras'}</p>
                        </div>

                        {config.grain && (
                            <div>
                                <p className="text-sm text-muted-foreground">Orientación de Veta</p>
                                <p className="font-medium capitalize">{config.grain}</p>
                            </div>
                        )}
                    </div>

                    {handle && (
                        <>
                            <Separator />
                            <div>
                                <p className="text-sm text-muted-foreground">Jaladera</p>
                                <p className="font-medium">{handle.model} - {handle.finish}</p>
                                <p className="text-xs text-muted-foreground">
                                    Precio: ${Number(handle.price).toFixed(2)} MXN
                                </p>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dimensions Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Dimensiones y Cantidad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Ancho</p>
                            <p className="font-medium text-lg">{config.width} mm</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Alto</p>
                            <p className="font-medium text-lg">{config.height} mm</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Cantidad</p>
                            <p className="font-medium text-lg">{config.quantity} {config.quantity === 1 ? 'unidad' : 'unidades'}</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-muted-foreground">Área por unidad</p>
                        <p className="font-medium">{area.toFixed(4)} m²</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Área total: {(area * config.quantity).toFixed(4)} m²
                        </p>
                    </div>

                    {(config.width > 1500 || config.height > 1500) && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-sm text-yellow-800">
                                <strong>⚠️ Advertencia:</strong> Productos con dimensiones mayores a 1500 mm NO aplican garantía
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Additional Options Card */}
            {(config.isExhibition || config.isExpressDelivery) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Opciones Adicionales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {config.isExhibition && (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-xl">🏢</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Producto de Exhibición</p>
                                    <p className="text-sm text-muted-foreground">Cargo adicional: $500.00 MXN</p>
                                </div>
                            </div>
                        )}
                        {config.isExpressDelivery && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-xl">⚡</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">Entrega Express</p>
                                    <p className="text-sm text-muted-foreground">Cargo adicional: $500.00 MXN</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Pricing Breakdown Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Desglose de Precios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Precio base (área × $0.05/mm²)</span>
                            <span className="font-medium">${pricing.breakdown.basePrice.toFixed(2)}</span>
                        </div>

                        {pricing.breakdown.toneAdjustment !== 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ajuste por tono</span>
                                <span className="font-medium">${pricing.breakdown.toneAdjustment.toFixed(2)}</span>
                            </div>
                        )}

                        {pricing.breakdown.carsAdjustment !== 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Ajuste 2 caras</span>
                                <span className="font-medium">${pricing.breakdown.carsAdjustment.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Mano de obra</span>
                            <span className="font-medium">${pricing.breakdown.laborCost.toFixed(2)}</span>
                        </div>

                        <Separator className="my-2" />

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Precio unitario</span>
                            <span className="font-semibold">${pricing.unitPrice.toFixed(2)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Cantidad × {config.quantity}</span>
                            <span className="font-semibold">${(pricing.unitPrice * config.quantity).toFixed(2)}</span>
                        </div>

                        {pricing.breakdown.handlePrice > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Jaladera</span>
                                <span className="font-semibold">${pricing.breakdown.handlePrice.toFixed(2)}</span>
                            </div>
                        )}

                        {pricing.breakdown.exhibitionFee && pricing.breakdown.exhibitionFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Producto de Exhibición</span>
                                <span className="font-semibold">${pricing.breakdown.exhibitionFee.toFixed(2)}</span>
                            </div>
                        )}

                        {pricing.breakdown.expressDeliveryFee && pricing.breakdown.expressDeliveryFee > 0 && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Entrega Express</span>
                                <span className="font-semibold">${pricing.breakdown.expressDeliveryFee.toFixed(2)}</span>
                            </div>
                        )}

                        <Separator className="my-3" />

                        <div className="flex flex-col sm:flex-row justify-between items-center bg-module-black text-white p-3 sm:p-4 rounded-lg gap-2">
                            <span className="text-base sm:text-lg font-semibold">TOTAL</span>
                            <span className="text-xl sm:text-2xl font-bold">${pricing.totalPrice.toFixed(2)} MXN</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>📝 Nota:</strong> Los precios son estimados. El precio final puede variar según disponibilidad y condiciones del mercado.
                </p>
            </div>
        </div>
    )
}
