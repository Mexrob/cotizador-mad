# Sistema de Wizards Configurables

Sistema completo que permite a administradores crear wizards de cotización personalizados con diferentes pasos, fórmulas de precios y asignarlos a usuarios/roles específicos.

## Características

- ✅ **Crear wizards personalizados**: Elige qué pasos incluir y su orden
- ✅ **Pasos reutilizables**: Usa los pasos existentes o crea nuevos
- ✅ **Pasos condicionales**: Muestra/oculta pasos según selecciones previas
- ✅ **Cálculos configurables**: Fórmulas personalizadas para cada wizard
- ✅ **Asignación por roles**: Asigna wizards a roles o usuarios específicos
- ✅ **Panel de administración**: UI completa para gestionar wizards
- ✅ **Drag & drop**: Reordena pasos fácilmente
- ✅ **Preview**: Prueba wizards antes de publicarlos

## Arquitectura

### Modelos de Base de Datos

#### WizardTemplate
Almacena la configuración completa del wizard:
- `name`, `code`: Identificación
- `stepsConfig`: Array de pasos con configuración
- `pricingConfig`: Fórmulas y ajustes de precios
- `validationRules`: Reglas de validación
- `uiConfig`: Personalización de UI

#### WizardStepDefinition
Catálogo de tipos de pasos disponibles:
- `name`, `code`: Identificación del tipo de paso
- `componentName`: Componente React a renderizar
- `configSchema`: Schema de configuración del paso
- `stepType`: STANDARD, CUSTOM, CONDITIONAL, CALCULATION

#### WizardAssignment
Asigna templates a usuarios/roles:
- `templateId`: Referencia al template
- `userId` o `role`: Asignación específica
- `priority`: Prioridad en caso de conflictos

### Componentes Principales

#### ConfigurableWizard
Componente principal que renderiza el wizard basado en configuración:

```tsx
import { ConfigurableWizard } from '@/components/configurable-wizard'

<ConfigurableWizard
  templateCode="standard-doors" // o templateId
  onComplete={(data, pricing) => {
    // data: datos recolectados
    // pricing: { subtotal, adjustments[], total }
  }}
/>
```

#### WizardAdminPanel
Panel completo de administración:

```tsx
import { WizardAdminPanel } from '@/components/wizard-admin/wizard-admin-panel'

<WizardAdminPanel />
```

## Pasos Disponibles

| Código | Nombre | Descripción |
|--------|--------|-------------|
| `category-selection` | Selección de Categoría | Categoría del producto |
| `line-selection` | Selección de Línea | Línea de producto |
| `dimensions` | Dimensiones | Ancho, alto, cantidad |
| `tone-selection` | Selección de Tono | Color/tono del producto |
| `grain-selection` | Dirección de Veta | Horizontal/Vertical |
| `back-face-selection` | Cara Trasera | Tipo de cara trasera |
| `edge-banding-selection` | Cubrecanto | Tipo de cubrecanto |
| `handle-selection` | Jaladera | Modelo de jaladera |
| `optionals` | Opcionales | Exhibición, express, etc. |
| `summary` | Resumen | Resumen final con precios |
| `custom` | Personalizado | Paso completamente custom |

## Configuración de un Wizard

### Ejemplo básico

```json
{
  "name": "Wizard Express VIP",
  "code": "express-vip",
  "stepsConfig": [
    {
      "id": "step-1",
      "stepDefinitionCode": "dimensions",
      "order": 0,
      "isRequired": true,
      "isEnabled": true,
      "config": {
        "minWidth": 200,
        "maxWidth": 1200,
        "allowQuantity": true
      }
    },
    {
      "id": "step-2",
      "stepDefinitionCode": "tone-selection",
      "order": 1,
      "isRequired": true,
      "isEnabled": true,
      "config": {
        "filterByLine": false,
        "showPrices": true
      }
    },
    {
      "id": "step-3",
      "stepDefinitionCode": "summary",
      "order": 2,
      "isRequired": true,
      "isEnabled": true,
      "config": {
        "showPricing": true
      }
    }
  ],
  "pricingConfig": {
    "baseFormula": "glass-calculation",
    "adjustments": [
      {
        "name": "VIP Discount",
        "formula": "subtotal * -0.10",
        "applyTo": "subtotal"
      }
    ]
  }
}
```

### Pasos condicionales

```json
{
  "stepDefinitionCode": "grain-selection",
  "order": 2,
  "conditions": [
    {
      "field": "line",
      "operator": "in",
      "value": ["Europea Básica", "Europea Sincro"]
    }
  ]
}
```

### Fórmulas de precios

Fórmulas disponibles:
- `glass-calculation`: Vidrio - área × precio/m²
- `alhu-calculation`: Alhú - área × 4440
- `europea-basica-calculation`: Europea Básica - área × 977
- `europea-sincro-calculation`: Europea Sincro - área × 1400
- `alto-brillo-calculation`: Alto Brillo - área × precio/m²
- `super-mate-calculation`: Super Mate - área × precio/m²

También puedes crear fórmulas personalizadas con expresiones matemáticas.

## API Endpoints

### Administración

```
GET    /api/admin/wizard-templates          - Listar templates
POST   /api/admin/wizard-templates          - Crear template
PUT    /api/admin/wizard-templates/:id      - Actualizar
DELETE /api/admin/wizard-templates/:id      - Eliminar

GET    /api/admin/wizard-assignments        - Listar asignaciones
POST   /api/admin/wizard-assignments        - Crear asignación
DELETE /api/admin/wizard-assignments/:id    - Eliminar
```

### Públicos

```
GET /api/wizard-templates/get-config?id=xxx&code=yyy
```

## Flujo de Trabajo

### Para Administradores

1. Acceder a `/admin/wizards`
2. Crear nuevo wizard con "Nuevo Wizard"
3. Configurar:
   - Nombre y código
   - Agregar pasos desde el panel izquierdo
   - Reordenar con drag & drop
   - Configurar cada paso (click para expandir)
   - Configurar fórmulas de precios
   - Personalizar UI (opcional)
4. Guardar wizard
5. Asignar a roles/usuarios
6. Probar con "Preview"

### Para Usuarios

1. Ir a crear cotización
2. El sistema detecta automáticamente el wizard asignado según rol
3. Completar los pasos configurados
4. Al finalizar se crea el item con precios calculados

## Ejemplos de Uso

### Wizard Express para VIP
```tsx
// Configuración: Solo dimensiones, tono y resumen
// Precio: Fórmula estándar con 10% descuento
// UI: Tema dorado, textos personalizados
```

### Wizard Completo para Puertas
```tsx
// Configuración: Todos los pasos estándar
// Condiciones: Grain solo para Europea
// Precio: Fórmula según línea seleccionada
```

### Wizard Simplificado para Cajones
```tsx
// Configuración: Dimensiones, tono, resumen
// Sin opcionales ni jaladeras
```

## Personalización de UI

```json
{
  "uiConfig": {
    "theme": {
      "primaryColor": "#FFD700",
      "secondaryColor": "#1a1a1a"
    },
    "texts": {
      "title": "Cotización Express",
      "description": "En solo 3 pasos",
      "buttonLabels": {
        "next": "Continuar",
        "back": "Regresar",
        "finish": "Crear"
      }
    },
    "layout": {
      "showProgressBar": true,
      "showStepNumbers": false,
      "allowSkip": false,
      "allowBack": true
    }
  }
}
```

## Sistema de Asignación

### Prioridad
1. Asignación a usuario específico (máxima prioridad)
2. Asignación a rol del usuario
3. Wizard default del sistema

### Ejemplos de Asignación

```typescript
// Asignar a rol VIP
{
  templateId: "template-123",
  role: "VIP",
  priority: 1
}

// Asignar a usuario específico (anula el rol)
{
  templateId: "template-456",
  userId: "user-789",
  priority: 2
}
```

## Dependencias Requeridas

```json
{
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^7.x",
  "@dnd-kit/utilities": "^3.x",
  "framer-motion": "^10.x"
}
```

## Migración desde KitWizard

El sistema actual de KitWizard puede migrarse creando un template con la configuración actual y marcándolo como default.

## Roadmap

- [ ] Crear pasos completamente custom con code editor
- [ ] Visual editor para fórmulas de precios
- [ ] Analytics de uso de wizards
- [ ] A/B testing entre wizards
- [ ] Clonar wizards entre ambientes

## Notas Técnicas

- Los pasos se renderizan dinámicamente basado en `stepDefinitionCode`
- El estado del wizard se mantiene en un objeto central `WizardState`
- Los precios se recalculan automáticamente al cambiar datos
- Las validaciones se ejecutan antes de avanzar de paso
- El sistema es completamente extensible - nuevos pasos pueden agregarse al catálogo
