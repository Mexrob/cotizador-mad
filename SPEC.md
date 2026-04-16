# SPEC.md - Estándar de Desarrollo para Wizards

## Especificación SDD para Cotizadores (Wizards)

### 1. Estructura de Archivos

```
lib/wizard-base/
├── types.ts              # Interfaces y tipos base
├── components.tsx        # Componentes UI reutilizables
├── useWizardState.ts    # Hook de estado personalizado
└── template.tsx          # Plantilla de referencia
```

### 2. Interfaces Estándar

#### 2.1 WizardProps
Todos los wizards deben implementar esta interfaz:

```typescript
interface WizardProps {
  quoteId: string
  initialData?: WizardInitialData
  expressDeliveryPercentage?: number    // default: 20
  exhibitionPercentage?: number         // default: 25
  onComplete: (data: WizardOutputData) => void
  onCancel: () => void
}
```

#### 2.2 WizardInitialData
Datos que se pasan al wizard desde la página de cotización:

```typescript
interface WizardInitialData {
  // Básicos
  productId?: string
  width?: number
  height?: number
  quantity?: number
  
  // Configuración
  tone?: string
  isTwoSided?: boolean
  edgeBanding?: string
  
  // Jaladera
  handle?: string
  handleModelId?: string
  handlePrice?: number
  handleOrientation?: 'vertical' | 'horizontal'
  
  // Opciones
  expressShipping?: boolean
  demoProduct?: boolean
}
```

### 3. Componentes UI Estándar

#### 3.1 WizardProgressBar
Barra de progreso con pasos numerados.

#### 3.2 WizardNavigation
Botones de navegación (Atrás/Siguiente/Agregar).

#### 3.3 WizardStepContainer
Contenedor de paso con título e icono.

#### 3.4 WizardOptionCard
Tarjeta de opción seleccionable.

#### 3.5 WizardSummaryItem
Ítem de resumen en el paso final.

### 4. Patrón de Implementación

Cada wizard debe seguir este patrón:

```
1. Definir tipos específicos para el wizard
2. Definir opciones específicas (tones, handles, etc.)
3. Crear estado inicial desde initialData
4. Implementar restore de datos al editar
5. Implementar renderStep() con switch
6. Implementar calculateSubtotal() y calculateTotal()
7. Implementar handleAddToQuote()
8. Renderizar con WizardProgressBar + contenido + WizardNavigation
```

### 5. Pasos Estandard

| Paso | Nombre | Función |
|-----|--------|---------|
| 1 | Selección | Tono/color/producto |
| 2 | Dimensiones | Ancho x Alto |
| 3 | Configuración | Caras u otras opciones |
| 4 | Acabado | Cubrecanto, terminación |
| 5 | Herrajes | Jaladera, orientación |
| 6 | Opciones | Express, exhibición |
| 7 | Resumen | Vista previa y precios |

### 6. Convenciones de Nombres

#### 6.1命名 del Archivo
- `{nombre}-wizard/{nombre}-wizard.tsx`
- Ejemplo: `alto-brillo-wizard/alto-brillo-wizard.tsx`

#### 6.2 Interfaz
- `{Nombre}WizardProps`
- Ejemplo: `AltoBrilloWizardProps`

#### 6.3 Estado
- `WizardState` con subtipos:
  - `dimensions`: { width, height, quantity }
  - `options`: configuración específica
  - `specialOptions`: express, demo

#### 6.4 Funciones
- `canGoNext()` - Valida si puede avanzar
- `canGoBack()` - Valida si puede retroceder
- `handleNext()` - Avanza al siguiente paso
- `handleBack()` - Retrocede al paso anterior
- `calculateSubtotal()` - Calcula subtotal
- `calculateTotal()` - Calcula total con ajustes
- `handleAddToQuote()` - Finaliza y envía datos

### 7. Estilos CSS

Todos los wizards deben usar:

```css
/* Contenedor */
.flex.flex-col.h-[480px]

/* Progress Bar */
.flex.items-center.justify-between.mb-2.pb-2.border-b

/* Contenido */
.flex-1.overflow-y-auto

/* Navigation */
.flex.justify-between.mt-2.pt-4.border-t

/* Cards */
.grid.grid-cols-2.md:grid-cols-4.gap-4

/* Option Card */
.cursor-pointer.transition-all.hover:shadow-md
.selected ? 'border-primary bg-primary/10 ring-2 ring-primary' : 'border-gray-200'
```

### 8. Validaciones

- dimensiones: 300-3000mm
- cantidad: mínimo 1
- precio: mayor a 0

### 9. Cálculo de Precios

```typescript
// Área
area = (ancho / 1000) * (alto / 1000)

// Precio base
precioBase = area * precioPorMetro

// Ajustes
expressAmount = subtotal * (expressPercentage / 100)
exhibitionAmount = subtotal * (exhibitionPercentage / 100)

// Total
total = subtotal + expressAmount - exhibitionAmount
```

### 10. Errores Comunes

| Error | Causa | Solución |
|-------|-------|---------|
| No guarda selección | Faltante restore useEffect | Verificar initialData |
| No naviga | canGoNext always false | Revisar validación |
| No carga opciones | API no responde | Verificar fetch |
| Foreign key error | ID vacío enviado | Usar null o valor válido |

---

## Cómo Crear un Nuevo Wizard

1. Copiar `lib/wizard-base/template.tsx` como base
2. Definir las opciones específicas
3. Implementar cada paso con componentes estándar
4. Probar navegación
5. Probar guardado
6. Probar edición

---

## Próximos Pasos

- [x] Crear tipos base
- [x] Crear componentes UI
- [x] Crear hook de estado
- [x] Aplicar normalización a Alto Brillo
- [x] Aplicar normalización a Europa Básica
- [x] Aplicar normalización a Vidrio
- [x] Aplicar normalización a Cerámica
- [ ] Testing de consistencia