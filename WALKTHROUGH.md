# Walkthrough: Wizard con Precios Base por Tono

## ✅ Actualización Completada

Se han agregado los precios base para cada tono en el wizard configurador.

## Cambios Implementados

### 1. Constante de Precios ([types.ts](components/kit-wizard/types.ts))

Se agregó la constante `TONE_PRICES` con los precios base de cada tono:

```typescript
export const TONE_PRICES: Record<string, number> = {
  'Blanco - Brillante': 4940.00,
  'Blanco - Mate': 5100.00,
  'Paja - Brillante': 4940.00,
  'Paja - Mate': 5100.00,
  'Capuchino - Brillante': 4940.00,
  'Capuchino - Mate': 5100.00,
  'Humo - Brillante': 4940.00,
  'Humo - Mate': 5100.00,
  'Gris - Brillante': 4940.00,
  'Gris - Mate': 5100.00,
  'Rojo - Brillante': 5100.00,
  'Rojo - Mate': 5200.00,
  'Negro - Brillante': 4940.00,
  'Negro - Mate': 5100.00,
}
```

### 2. Visualización de Precios ([StepTone.tsx](components/kit-wizard/steps/StepTone.tsx))

El paso 4 ahora muestra el precio base de cada tono:

**Características**:
- ✅ Badge con precio formateado en MXN
- ✅ Diseño mejorado con `flex-start` para acomodar precio
- ✅ Tamaño de texto reducido para mejor legibilidad
- ✅ Importación de `formatMXN` para formato consistente

**Vista**:
```
┌─────────────────────────────┐
│ Blanco - Brillante      ✓   │
│ $4,940.00                   │
└─────────────────────────────┘
```

### 3. Cálculo de Precios ([KitWizard.tsx](components/kit-wizard/KitWizard.tsx))

**Antes**:
```typescript
// Precio basado en área y precio por m²
const area = (width / 1000) * (height / 1000)
const pricePerM2 = 1500
const basePrice = area * pricePerM2 * quantity
```

**Ahora**:
```typescript
// Precio basado en el tono seleccionado
const tonePrice = state.tone ? TONE_PRICES[state.tone] || 0 : 0
const basePrice = tonePrice * state.dimensions.quantity
```

**Dependencias del cálculo**:
```typescript
useEffect(() => {
  calculatePricing()
}, [
  state.dimensions,      // Cantidad
  state.frontDimensions, // (No usado actualmente)
  state.tone,            // ← NUEVO: Recalcula al cambiar tono
  state.handle,          // Jaladera
  state.optionals,       // Opcionales
])
```

## Flujo de Precios

### Paso 4: Selección de Tono
1. Usuario ve todos los tonos con sus precios
2. Selecciona un tono
3. El precio base se actualiza automáticamente

### Paso 9: Resumen
El resumen muestra:
```
Precio Base: $9,880.00  (Blanco - Brillante × 2)
Jaladera: $400.00
Exhibición: $0.00
Entrega Express: $500.00
─────────────────────
Total: $10,780.00
```

## Precios por Tono

| Tono | Brillante | Mate |
|------|-----------|------|
| **Blanco** | $4,940.00 | $5,100.00 |
| **Paja** | $4,940.00 | $5,100.00 |
| **Capuchino** | $4,940.00 | $5,100.00 |
| **Humo** | $4,940.00 | $5,100.00 |
| **Gris** | $4,940.00 | $5,100.00 |
| **Rojo** | $5,100.00 | $5,200.00 |
| **Negro** | $4,940.00 | $5,100.00 |

### Observaciones
- La mayoría de tonos brillantes: **$4,940.00**
- La mayoría de tonos mate: **$5,100.00**
- **Rojo Brillante** es más caro: **$5,100.00**
- **Rojo Mate** es el más caro: **$5,200.00**

## Archivos Modificados

1. **[components/kit-wizard/types.ts](components/kit-wizard/types.ts)**
   - Agregado `TONE_PRICES` constant

2. **[components/kit-wizard/steps/StepTone.tsx](components/kit-wizard/steps/StepTone.tsx)**
   - Importado `TONE_PRICES` y `formatMXN`
   - Agregado `Badge` con precio
   - Mejorado layout de cards

3. **[components/kit-wizard/KitWizard.tsx](components/kit-wizard/KitWizard.tsx)**
   - Importado `TONE_PRICES`
   - Actualizado `calculatePricing()` para usar precios de tonos
   - Agregado `state.tone` a dependencias de `useEffect`

## Ejemplo de Cálculo

**Configuración**:
- Tono: Blanco - Mate ($5,100.00)
- Cantidad: 3 unidades
- Jaladera: Sorento A Negro ($200 × 3 = $600)
- Opcionales: Entrega Express ($500)

**Cálculo**:
```
Precio Base = $5,100.00 × 3 = $15,300.00
Jaladera = $200 × 3 = $600.00
Subtotal = $15,300.00 + $600.00 = $15,900.00
Entrega Express = $500.00
Total = $15,900.00 + $500.00 = $16,400.00
```

## Estado del Sistema

✅ **Completado**:
- [x] Constante de precios por tono
- [x] Visualización de precios en paso 4
- [x] Cálculo automático basado en tono
- [x] Actualización reactiva al cambiar tono
- [x] Formato consistente de precios (MXN)
- [x] Servidor compilando correctamente

## Próximos Pasos Sugeridos

1. **Precios de Jaladeras**: Agregar precios reales desde BD
2. **Validación**: Verificar que los precios coincidan con la BD
3. **Testing**: Probar cálculos con diferentes combinaciones
4. **Imágenes**: Agregar imágenes a los tonos para mejor visualización

## Conclusión

El wizard ahora calcula precios basándose en el tono seleccionado, mostrando el precio base de cada opción para que el cliente pueda tomar decisiones informadas. Los precios se actualizan automáticamente al cambiar la selección.

**Estado**: ✅ FUNCIONAL
**Servidor**: ✅ Corriendo en http://localhost:3000

## Edición de Kits

Se ha implementado la funcionalidad para editar kits existentes:

1. **Botón de Edición**: El icono de lápiz en la tabla de productos ahora abre el wizard con la configuración actual del item.
2. **Carga de Estado**: El wizard se inicializa con los datos guardados (dimensiones, tono, jaladera, etc.).
3. **Actualización**: Al finalizar el wizard, se actualiza el item existente en lugar de crear uno nuevo.
4. **API**: Se creó un nuevo endpoint `PUT /api/quotes/[id]/items/kit/[itemId]` para manejar las actualizaciones.

## Simplificación de Dimensiones

Se eliminó la sección de "Dimensiones del Frente" del Paso 3, dejando solo las dimensiones principales (Ancho y Alto) y la cantidad, simplificando el flujo para el usuario.

## Base de Datos

Se ejecutó un script de "seeding" (`scripts/seed-kit-data.ts`) para asegurar que todos los Tonos y Jaladeras existan en la base de datos. Esto es necesario para que las referencias se guarden y recuperen correctamente al editar.

Además, se actualizó el esquema de Prisma para incluir el campo `edgeBanding` en el modelo `QuoteItem`, permitiendo persistir la selección del tipo de cubrecanto.

## Imágenes

Se han integrado imágenes para:
- **Línea**: Muestra imagen representativa de "Vidrio".
- **Tonos**: Muestra swatches de color para cada tono.
- **Jaladeras**: Muestra la imagen del modelo de jaladera seleccionado.
Las imágenes se cargan dinámicamente desde `public/images/`.

## Mejoras de UI

- **Scroll**: Se implementó scroll nativo (`overflow-y-auto`) en el wizard para asegurar que todo el contenido sea accesible en pantallas más pequeñas o cuando hay muchas opciones, manteniendo la cabecera y los botones de navegación fijos.
- **Confirmación de Eliminación**: Se agregó un diálogo de confirmación al intentar eliminar un producto de la cotización para prevenir acciones accidentales.
