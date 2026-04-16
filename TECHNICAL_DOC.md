# Documentación Técnica del Proyecto

## 1. Arquitectura General

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Shadcn UI
- **Backend**: Next.js API Routes, NextAuth.js
- **Base de datos**: PostgreSQL, Prisma ORM
- **Contenedores**: Docker, Docker Compose

### Estructura de Carpetas
```
├── app/                    # Next.js App Router
│   ├── api/              # Endpoints de API
│   │   ├── admin/        # Rutas de administración
│   │   ├── auth/        # Autenticación
│   │   ├── products/     # Gestión de productos
│   │   └── quotes/      # Gestión de cotizaciones
│   └── quotes/[id]/     # Página de cotización
├── components/            # Componentes React
│   ├── ui/              # Componentes Shadcn
│   ├── configura*/      # Wizards de cotización
│   └── products-table/
├── lib/                  # Utilidades
│   ├── db.ts            # Prisma client
│   ├── auth.ts          # Config NextAuth
│   ├── utils.ts         # Funciones utilitarias
│   └── wizard-*.ts      # Lógica de precios
├── prisma/
│   └── schema.prisma    # Schema de base de datos
└── public/
    └── images/          # Imágenes estáticas
```

## 2. WIZARDS DE COTIZACIÓN

### 2.1 Europa Básica
- **Ubicación**: `components/europa-basica-wizard/`
- **Línea DB**: `Europa Básica`
- **Pasos**:
  1. Selección de tono/color
  2. Dimensiones (ancho x alto)
  3. Orientación de veta (vertical/horizontal)
  4. Caras (1 o 2)
  5. Cubrecanto
  6. Jaladera + orientación
  7. Opciones (express/exhibición)
  8. Resumen

### 2.2 Europa Sincro
- **Ubicación**: `components/europa-sincro-wizard/`
- **Línea DB**: `Europa Sincro`
- Similar a Europa Básica

### 2.3 Vidrio
- **Ubicación**: `components/vidrio-wizard/`
- **Línea DB**: `Vidrio`
- Configuración específica para productos de vidrio

### 2.4 Cerámica
- **Ubicación**: `components/ceramica-wizard/`
- **Línea DB**: `Cerámica`
- Tonos y colores específicos

### 2.5 Alto Brillo (Nuevo)
- **Ubicación**: `components/alto-brillo-wizard/`
- **Línea DB**: `Alto brillo` (ID: `cmm84o1r80004le11x2p8qhbw`)
- **Pasos**:
  1. Tono/Color (Alaska, Obsidiana, Magnesio, Topacio)
  2. Dimensiones y cantidad
  3. Caras (1 o 2)
  4. Cubrecanto
  5. Jaladera + orientación
  6. Opciones (express/exhibición)
  7. Resumen

## 3. BASE DE DATOS

### Modelos Principales

#### Quote
- `id`: ID único
- `quoteNumber`: Número de cotización
- `customerName`, `customerEmail`, `customerPhone`, `customerAddress`
- `projectName`, `projectAddress`
- `status`: Estado (Pendiente, Enviada, Aprobada, Rechazada)
- `subtotal`, `taxAmount`, `discountAmount`, `totalAmount`
- `isExpressOrder`, `isExhibitionOrder`
- `validUntil`, `deliveryDate`
- `userId`: Relación con usuario

#### QuoteItem
- `id`: ID único
- `quoteId`: Relación con Quote
- `productId`: Producto base
- `productLineId`: Línea de producto
- `quantity`: Cantidad
- `customWidth`, `customHeight`: Dimensiones personalizadas
- `unitPrice`, `totalPrice`: Precios
- `edgeBanding`: Tipo de cubrecanto
- `jaladera`, `jaladeraOrientation`: Jaladera seleccionada
- `isTwoSided`: Si es de 2 caras
- `isExpressDelivery`, `isExhibition`: Opciones especiales

#### Product
- `id`: ID único
- `name`: Nombre del producto
- `categoryId`: Categoría
- `linea`: Línea (Europa Básica, Vidrio, etc.)
- `precioBaseM2`: Precio base por m²
- `tiempoEntrega`: Días de entrega

#### ProductLine
- `id`: ID único
- `name`: Nombre (Alto Brillo, Europa Básica, etc.)
- `code`: Código único

#### ProductTone
- `id`: ID único
- `name`: Nombre del tono
- `lineId`: Línea asociada
- `priceAdjustment`: Ajuste de precio
- `hexColor`: Color en hexadecimal

#### HandleModel
- `id`: ID único
- `name`: Nombre del modelo
- `finish`: Acabado
- `price`: Precio por metro

## 4. APIs PRINCIPALES

### 4.1 Cotizaciones (`/api/quotes/`)

#### GET `/api/quotes/[id]`
- Retorna una cotización con sus items
- Incluye: usuario, cliente, items, líneas relacionadas

#### POST `/api/quotes/`
- Crea nueva cotización
- Body: customerName, customerEmail, projectName, etc.

#### PUT `/api/quotes/[id]/items/[itemId]`
- Actualiza un item de cotización
- Permite cambiar dimensiones, precios, opciones

### 4.2 Items Configurados (`/api/quotes/[id]/items/configured`)

#### POST - Agregar item
- Body esperado:
```json
{
  "lineId": "cmm84o1r80004le11x2p8qhbw",
  "quantity": 1,
  "width": 1000,
  "height": 1000,
  "unitPrice": 2888,
  "totalPrice": 2743.6,
  "edgeBanding": "Mismo tono de puerta",
  "isTwoSided": false,
  "isExpressDelivery": true,
  "jaladera": "Sorento A Negro",
  "jaladeraOrientation": "vertical",
  "handlePrice": 890
}
```

### 4.3 Productos (`/api/products/`)

#### GET `/api/products?linea=Europa%20Básica&limit=100`
- Lista productos con filtros
- Soporta paginación

### 4.4 Modelos de Jaladeras (`/api/handle-models`)

#### GET `/api/handle-models`
- Lista todos los modelos de jaladeras disponibles

## 5. FLUJO DE DATOS

### 5.1 Crear Cotización
1. Usuario crea cotización desde dashboard
2. Sistema crea registro en tabla `Quote`
3. Usuario agrega productos via wizard

### 5.2 Agregar Producto (Alto Brillo Ejemplo)
1. Wizard recoje configuraciones (pasos 1-7)
2. Envía JSON a `/api/quotes/[id]/items/configured`
3. Backend:
   - Busca producto base por línea
   - Valida tiempo de entrega
   - Crea QuoteItem
   - Recalcula totales
4. Frontend muestra toast de éxito

### 5.3 Editar Producto
1. Usuario hace clic en editar
2. Se cargan datos del item al wizard via `initialData`
3. Wizard restaura selecciones guardadas
4. Usuario modifica y guarda
5.PUT a `/api/quotes/[id]/items/[itemId]`

## 6. CONFIGURACIÓN

### Variables de Entorno (.env)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
```

### Docker
- `cotizador-app`: Aplicación Next.js
- `cotizador-postgres`: Base de datos
- `cotizador-nginx`: Servidor web

## 7. TÉRMINOS IMPORTANTES

- **Wizard**: Componente React para configuración de productos
- **Línea**: Categoría de producto (Europa Básica, Vidrio, etc.)
- **Tono**: Variante de color de una línea
- **Cubrecanto**: Acabado de cantos
- **Jaladera**: Manija/pomo de puerta
- **Tiempo de entrega**: Días para entrega (no se pueden mezclar diferentes)