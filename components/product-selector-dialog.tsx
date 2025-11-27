'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ProductConfigurator from './product-configurator'
import { Button } from './ui/button'
import { Wand2, Package } from 'lucide-react'

interface ProductSelectorDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfiguredProductAdd: (config: any) => void
    onStandardProductAdd: () => void
}

export default function ProductSelectorDialog({
    open,
    onOpenChange,
    onConfiguredProductAdd,
    onStandardProductAdd,
}: ProductSelectorDialogProps) {
    const [showConfigurator, setShowConfigurator] = useState(false)

    const handleConfiguratorComplete = (config: any) => {
        onConfiguredProductAdd(config)
        setShowConfigurator(false)
        onOpenChange(false)
    }

    const handleConfiguratorCancel = () => {
        setShowConfigurator(false)
    }

    const handleStandardProduct = () => {
        onStandardProductAdd()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                {!showConfigurator ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-lg sm:text-xl">Agregar Producto</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 sm:py-6">
                            {/* Configured Product Option */}
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 hover:border-module-black hover:bg-gray-50 transition-all cursor-pointer"
                                onClick={() => setShowConfigurator(true)}
                            >
                                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                                    <div className="bg-module-black text-white p-3 sm:p-4 rounded-full">
                                        <Wand2 className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base sm:text-lg mb-2">
                                            Producto Configurado
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Usa el asistente guiado para configurar un producto personalizado con
                                            línea, tono, dimensiones y más
                                        </p>
                                    </div>
                                    <Button className="w-full text-sm">
                                        Abrir Configurador
                                    </Button>
                                </div>
                            </div>

                            {/* Standard Product Option */}
                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 sm:p-8 hover:border-module-black hover:bg-gray-50 transition-all cursor-pointer"
                                onClick={handleStandardProduct}
                            >
                                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                                    <div className="bg-gray-600 text-white p-3 sm:p-4 rounded-full">
                                        <Package className="w-6 h-6 sm:w-8 sm:h-8" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-base sm:text-lg mb-2">
                                            Producto Estándar
                                        </h3>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Selecciona un producto del catálogo existente sin configuración adicional
                                        </p>
                                    </div>
                                    <Button variant="outline" className="w-full text-sm">
                                        Seleccionar del Catálogo
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <ProductConfigurator
                        onComplete={handleConfiguratorComplete}
                        onCancel={handleConfiguratorCancel}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
