
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WizardStepProps } from '@/lib/wizard-configurable/types'
import { formatMXN } from '@/lib/utils'

export function StepSummary({ state }: WizardStepProps) {
    const items = state.items

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Resumen de Cotización</h2>
                <p className="text-muted-foreground">Productos configurados en esta sesión</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
                {items.length === 0 ? (
                    <p className="text-center text-muted-foreground">No hay partidas configuradas aún.</p>
                ) : (
                    items.map((item, index) => (
                        <Card key={index} className="border-l-4 border-l-primary">
                            <CardHeader>
                                <CardTitle className="text-lg flex justify-between">
                                    <span>Partida {index + 1}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(item).map(([key, value]) => (
                                        <div key={key}>
                                            <p className="text-xs text-muted-foreground uppercase">{key}</p>
                                            <p className="text-sm font-medium">
                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {state.pricing.total > 0 && (
                    <Card className="bg-primary/5">
                        <CardContent className="pt-6">
                            <div className="flex justify-between text-xl font-bold">
                                <span>Total Cotización</span>
                                <span>{formatMXN(state.pricing.total)}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}

