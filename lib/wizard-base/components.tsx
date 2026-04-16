import { ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/**
 * WizardProgressBar - Barra de progreso estándar para todos los wizards
 * 
 * Usage:
 * <WizardProgressBar currentStep={step} totalSteps={7} />
 */

interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
  onStepClick?: (step: number) => void
}

export function WizardProgressBar({ 
  currentStep, 
  totalSteps,
  labels,
  onStepClick
}: WizardProgressBarProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)
  
  return (
    <div className="flex items-center justify-between mb-2 pb-2 border-b shrink-0">
      {steps.map((step) => (
        <div key={step} className="flex items-center">
          <button
            type="button"
            onClick={() => onStepClick?.(step)}
            disabled={!onStepClick}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors
              ${currentStep > step 
                ? 'bg-primary text-white' 
                : currentStep === step
                  ? 'bg-primary text-white ring-2 ring-primary ring-offset-2'
                  : 'bg-gray-200 text-gray-500'
              }
              ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
            `}
          >
            {currentStep > step ? (
              <Check className="w-4 h-4" />
            ) : (
              step
            )}
          </button>
          {step < totalSteps && (
            <div
              className={`
                w-8 h-1 mx-1 rounded
                ${currentStep > step ? 'bg-primary' : 'bg-gray-200'}
              `}
            />
          )}
        </div>
      ))}
    </div>
  )
}

/**
 * WizardNavigation - Botones de navegación estándar
 * 
 * Usage:
 * <WizardNavigation 
 *   canGoBack={true}
 *   canGoNext={true}
 *   isLastStep={false}
 *   onBack={handleBack}
 *   onNext={handleNext}
 *   onFinish={handleFinish}
 * />
 */

interface WizardNavigationProps {
  canGoBack: boolean
  canGoNext: boolean
  isLastStep: boolean
  onBack: () => void
  onNext: () => void
  onFinish?: () => void
  backLabel?: string
  nextLabel?: string
  finishLabel?: string
  variant?: 'default' | 'green'
}

export function WizardNavigation({
  canGoBack,
  canGoNext,
  isLastStep,
  onBack,
  onNext,
  onFinish,
  backLabel = 'Atrás',
  nextLabel = 'Siguiente',
  finishLabel = 'Agregar a Cotización',
  variant = 'default'
}: WizardNavigationProps) {
  return (
    <div className="flex justify-between mt-2 pt-4 border-t shrink-0">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={!canGoBack}
      >
        <ChevronLeft className="w-4 h-4 mr-2" />
        {backLabel}
      </Button>
      
      {isLastStep ? (
        <Button
          onClick={onFinish}
          className={variant === 'green' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Check className="w-4 h-4 mr-2" />
          {finishLabel}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!canGoNext}
        >
          {nextLabel}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  )
}

/**
 * WizardStepContainer - Contenedor de paso con header estándar
 * 
 * Usage:
 * <WizardStepContainer title="Selección de Color" icon={Palette}>
 *   {children}
 * </WizardStepContainer>
 */

interface WizardStepContainerProps {
  title: string
  icon?: LucideIcon
  children: ReactNode
}

export function WizardStepContainer({ title, icon: Icon, children }: WizardStepContainerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-5 h-5" />}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

/**
 * WizardOptionCard - Tarjeta de opción seleccionable
 * 
 * Usage:
 * <WizardOptionCard
 *   selected={selected}
 *   onClick={() => select(value)}
 * >
 *   {content}
 * </WizardOptionCard>
 */

interface WizardOptionCardProps {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}

export function WizardOptionCard({ 
  selected, 
  onClick, 
  children,
  className = ''
}: WizardOptionCardProps) {
  return (
    <Card
      className={`
        cursor-pointer transition-all hover:shadow-md
        ${selected 
          ? 'border-primary bg-primary/10 ring-2 ring-primary' 
          : 'border-gray-200'
        }
        ${className}
      `}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {children}
        {selected && (
          <div className="flex justify-center mt-2">
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="w-4 h-4" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * WizardSummaryItem - Ítem de resumen estándar
 * 
 * Usage:
 * <WizardSummaryItem label="Ancho" value="1000 mm" />
 * <WizardSummaryItem label="Total" value="$2,500" isTotal />
 */

interface WizardSummaryItemProps {
  label: string
  value: string | ReactNode
  isTotal?: boolean
  isHighlight?: boolean
  valueClass?: string
}

export function WizardSummaryItem({ 
  label, 
  value, 
  isTotal = false,
  isHighlight = false,
  valueClass = ''
}: WizardSummaryItemProps) {
  return (
    <div className={`flex justify-between ${isTotal ? 'border-t pt-3 text-lg' : ''}`}>
      <span className={isHighlight ? 'text-gray-900' : 'text-gray-600'}>
        {label}
      </span>
      <span className={`font-medium ${isHighlight ? 'text-gray-900' : ''} ${valueClass}`}>
        {value}
      </span>
    </div>
  )
}
