'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WizardStepProps } from '@/lib/wizard-configurable/types'

interface CustomField {
    name: string
    type: 'text' | 'number' | 'textarea' | 'select'
    label: string
    required: boolean
    options?: { label: string; value: string }[]
}

export function StepCustom({ state, updateState, config }: WizardStepProps) {
    const title = (config.config.title as string) || 'Paso Personalizado'
    const description = (config.config.description as string) || ''
    const fields = (config.config.fields as CustomField[]) || []
    
    const customData = (state.data.custom as Record<string, unknown>) || {}

    const handleChange = (fieldName: string, value: unknown) => {
        updateState({
            data: {
                ...state.data,
                custom: {
                    ...customData,
                    [fieldName]: value
                }
            }
        })
    }

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{title}</h2>
                {description && (
                    <p className="text-muted-foreground">{description}</p>
                )}
            </div>

            <Card>
                <CardContent className="pt-6 space-y-4">
                    {fields.map((field) => (
                        <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>
                                {field.label}
                                {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            
                            {field.type === 'text' && (
                                <Input
                                    id={field.name}
                                    value={(customData[field.name] as string) || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    required={field.required}
                                />
                            )}
                            
                            {field.type === 'number' && (
                                <Input
                                    id={field.name}
                                    type="number"
                                    value={(customData[field.name] as number) || ''}
                                    onChange={(e) => handleChange(field.name, parseFloat(e.target.value))}
                                    required={field.required}
                                />
                            )}
                            
                            {field.type === 'textarea' && (
                                <Textarea
                                    id={field.name}
                                    value={(customData[field.name] as string) || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    required={field.required}
                                    rows={4}
                                />
                            )}
                            
                            {field.type === 'select' && field.options && (
                                <select
                                    id={field.name}
                                    value={(customData[field.name] as string) || ''}
                                    onChange={(e) => handleChange(field.name, e.target.value)}
                                    required={field.required}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                >
                                    <option value="">Seleccionar...</option>
                                    {field.options.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    ))}

                    {fields.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                            Este paso no tiene campos configurados
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
