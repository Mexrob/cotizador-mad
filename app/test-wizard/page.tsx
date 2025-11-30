'use client'

import ProductConfigurator from '@/components/product-configurator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TestWizardPage() {
    const { toast } = useToast()

    const handleComplete = (config: any) => {
        console.log('Configuración completa:', config)
        toast({
            title: 'Producto configurado',
            description: `Total: $${config.totalPrice.toFixed(2)} MXN`,
        })
    }

    const handleCancel = () => {
        console.log('Configuración cancelada')
        toast({
            title: 'Cancelado',
            description: 'Configuración de producto cancelada',
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="bg-gradient-to-r from-module-black to-module-dark text-white py-6">
                <div className="max-w-7xl mx-auto px-4">
                    <Link href="/quotes">
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver a Cotizaciones
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">Prueba del Configurador de Productos</h1>
                    <p className="text-gray-200 mt-2">
                        Página de prueba para el wizard de configuración de productos
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Instrucciones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Este es el wizard de configuración de productos. Sigue los 6 pasos para configurar un producto personalizado:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                            <li><strong>Seleccionar Línea</strong> - Elige entre 10 líneas de producto</li>
                            <li><strong>Elegir Tono</strong> - Selecciona el color/acabado</li>
                            <li><strong>Configurar</strong> - Define caras (1 o 2) y orientación de veta</li>
                            <li><strong>Jaladera (Opcional)</strong> - Agrega un modelo de jaladera si lo deseas</li>
                            <li><strong>Dimensiones</strong> - Define ancho, alto y cantidad</li>
                            <li><strong>Resumen</strong> - Revisa tu configuración y el precio total</li>
                        </ol>
                        <p className="text-sm text-muted-foreground mt-4">
                            💡 <strong>Tip:</strong> Abre la consola del navegador (F12) para ver el resultado cuando completes la configuración.
                        </p>
                    </CardContent>
                </Card>

                <ProductConfigurator
                    onComplete={handleComplete}
                    onCancel={handleCancel}
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
            </div>
        </div>
    )
}
