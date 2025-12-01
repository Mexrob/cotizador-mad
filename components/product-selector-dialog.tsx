'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ProductConfigurator from './product-configurator'

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
    const handleConfiguratorComplete = (config: any) => {
        onConfiguredProductAdd(config)
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
                <DialogHeader className="sr-only">
                    <DialogTitle>Configurar Producto</DialogTitle>
                </DialogHeader>
                <ProductConfigurator
                    onComplete={handleConfiguratorComplete}
                    onCancel={() => onOpenChange(false)}
                    allowedLines={['Vidrio']}
                    allowedHandles={['Sorento A', 'Sorento L', 'Sorento G']}
                    allowedTones={[
                        'Blanco Brillante',
                        'Blanco Mate',
                        'Paja Brillante',
                        'Paja Mate',
                        'Capuchino Brillante',
                        'Capuchino Mate',
                        'Humo Brillante',
                        'Humo Mate',
                        'Gris Brillante',
                        'Gris Mate',
                        'Rojo Brillante',
                        'Rojo Mate',
                        'Negro Brillante',
                        'Negro Mate'
                    ]}
                />
            </DialogContent>
        </Dialog>
    )
}
