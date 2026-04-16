# Guía de WIZARDS de Cotización

## Vista General

Los Wizards son componentes que guían al usuario a través del proceso de configuración de productos para una cotización. Cada wizard tiene pasos específicos dependiendo del tipo de producto.

## 1. Cotizador Europa Básica

### Línea: `Europa Básica`

### Pasos:

| Paso | Nombre | Descripción |
|-----|--------|-------------|
| 1 | Tono/Color | Selección de color del producto |
| 2 | Dimensiones | Ancho x Alto en mm |
| 3 | Orientación veta | Vertical u Horizontal |
| 4 | Caras | 1 o 2 caras |
| 5 | Cubrecanto | Tono aluminio o Similar |
| 6 | Jaladera | Modelo + Orientación |
| 7 | Opciones | Express (+20%) / Exhibición (-25%) |
| 8 | Resumen | Vista previa de configuración |

### Endpoint de API
- POST `/api/quotes/[id]/items/europea`

---

## 2. Cotizador Europa Sincro

### Línea: `Europa Sincro`

### Características
- Similar a Europa Básica
-(Configuración específica para productos syncrón)

---

## 3. Cotizador Vidrio

### Línea: `Vidrio`

### Pasos:

| Paso | Nombre | Descripción |
|-----|--------|-------------|
| 1 | Color | Selección de color vidrio |
| 2 | Dimensiones | Ancho x Alto |
| 3 | Acabado | Tipo de acabado |
| 4 | Opciones | Express / Exhibición |
| 5 | Resumen | Vista previa |

### Reglas Especiales
- Valida tiempo de entrega único por cotización
- No permite mezclar diferentes tiempos de entrega

---

## 4. Cotizador Cerámica

### Línea: `Cerámica`

### Pasos:

| Paso | Nombre | Descripción |
|-----|--------|-------------|
| 1 | Modelo | Selección de modelo |
| 2 | Color | Color del modelo |
| 3 | Dimensiones | Ancho x Alto |
| 4 | Opciones | Express / Exhibición |
| 5 | Resumen | Vista previa |

---

## 5. Cotizador Alto Brillo (NUEVO)

### Línea: `Alto brillo`
### ID: `cmm84o1r80004le11x2p8qhbw`

### Pasos:

| Paso | Nombre | Opciones |
|-----|--------|----------|
| 1 | Tono/Color | Alaska, Obsidiana, Magnesio, Topacio |
| 2 | Dimensiones | Ancho x Alto (300-1500mm) |
| 3 | Caras | 1 Cara, 2 Caras |
| 4 | Cubrecanto | Mismo tono de puerta |
| 5 | Jaladera + Orientación | No aplica, Sorento A Negro, Sorento L Negro, Sorento G Negro, Sorento A Aluminio, Sorento L Aluminio, Sorento G Aluminio + Vertical/Horizontal |
| 6 | Opciones | Envío express (+20%), Producto exhibición (-25%) |
| 7 | Resumen | Vista completa con precios |

### Cálculo de Precios
```typescript
// Área en m²
area = (ancho / 1000) * (alto / 1000)

// Precio base tono
precioBase = 1998 * area

// Precio jaladera (si aplica)
precioJaladera = calcularJaladera(medida, precioPorMetro)

// Subtotal
subtotal = (precioBase + precioJaladera) * cantidad

// Ajustes
total = subtotal + (express ? subtotal * 0.20 : 0) - (demo ? subtotal * 0.25 : 0)
```

### Endpoint de API
- POST `/api/quotes/[id]/items/configured`

---

## 6. WIZARDS NO ACTIVOS

### Alhú (Deshabilitado temporalmente)
- Línea: `Alhú`
- Actualmente commented en código

---

## Cómo Agregar un Nuevo Cotizador

### 1. Crear Componente
```
components/nuevo-wizard/nuevo-wizard.tsx
```

### 2. Definir Pasos
Seguir el patrón de steps (1, 2, 3... hasta n)

### 3. Registrar en page.tsx
```typescript
const NuevoWizard = dynamic(() => import('@/components/nuevo-wizard/nuevo-wizard'), { ssr: false })

// Agregar estado
const [showNuevoWizard, setShowNuevoWizard] = useState(false)

// Agregar botón en la lista de cotizadores
{ id: 'nuevo', name: 'Nuevo' }

// Agregar handler
} else if (configurator.id === 'nuevo') {
  setNuevoWizardInitialData(undefined)
  setShowNuevoWizard(true)
}
```

### 4. Agregar Dialog
```jsx
<Dialog open={showNuevoWizard} onOpenChange={setShowNuevoWizard}>
  <NuevoWizard
    initialData={nuevoWizardInitialData}
    onComplete={async (data) => {...}}
  />
</Dialog>
```

---

## Edición de Wizard Existente

Para editar un wizard existente:
1. Modificar el componente en `components/[wizard]/`
2. Los cambios se reflejan automáticamente al recargar

---

## Troubleshooting

### "Error en el tiempo de entrega"
- Ocurre cuando intentas agregar productos de diferentes líneas con distintos tiempos de entrega
- Solución: Usar productos de la misma línea o línea con mismo tiempo de entrega

### "Producto no encontrado"
- Verificar que la línea exista en base de datos
- Verificar ID de línea en código

### No se guarda la selección al editar
- Verificar que `initialData` contenga los campos correctos
- Verificar useEffect de restauración

### Error de foreign key
- Verificar que los IDs de referencias no sean strings vacíos
- Enviar `null` o valor vacío en lugar de ID inválido