# Reporte del Proyecto: Cotizador MAD

## 1. Descripción General

**Cotizador MAD** es una aplicación web completa para la gestión de cotizaciones de mobiliario y productos para cocina y closets. Desarrollada con Next.js 14, la plataforma permite a usuarios (distribuidores, minoristas, mayoristas) crear cotizaciones personalizadas de productos como puertas de vidrio, cerámica, Aluminum (Alhú), Super Mate, entre otros.

### Propósito del Proyecto

- Generar cotizaciones de mobiliario de cocina/closets de manera ágil
- Configurar productos con opciones de personalización (dimensiones, tonos, colores, jaladeras)
- Gestionar catálogos de productos, categorías, líneas y precios
- Administrar usuarios con diferentes roles y descuentos

---

## 2. Tecnología y Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **UI**: Tailwind CSS + Shadcn UI + Radix UI
- **Estado**: Zustand + Jotai (React Query para data fetching)
- **Formularios**: React Hook Form + Zod
- **Componentes**: Radix UI (primitivos accesibles)

### Backend
- **API**: Next.js API Routes (Route Handlers)
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **Validación**: Zod
- **Base de Datos**: PostgreSQL

### Herramientas de Desarrollo
- **Package Manager**: Yarn
- **Linting**: ESLint
- **Estilos**: Tailwind CSS + clsx + tailwind-merge

---

## 3. Estructura del Proyecto

```
cotizador-mad/
├── app/                    # Next.js App Router
│   ├── admin/              # Panel de administración
│   │   ├── page.tsx       # Dashboard admin
│   │   ├── products/       # Gestión de productos
│   │   ├── wizards/       # Administración de wizards
│   │   └── ...
│   ├── api/               # API Routes
│   │   ├── quotes/        # Endpoints de cotizaciones
│   │   ├── products/      # Endpoints de productos
│   │   ├── users/         # Endpoints de usuarios
│   │   ├── admin/         # Endpoints admin
│   │   └── auth/          # NextAuth
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/        # Dashboard de usuario
│   ├── products/          # Catálogo de productos
│   ├── profile/           # Perfil de usuario
│   ├── quotes/            # Gestión de cotizaciones
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página de inicio
├── components/             # Componentes React
│   ├── ui/                # Componentes base (shadcn)
│   ├── kit-wizard/        # Wizard antiguo de kits
│   ├── configurable-wizard/# Nuevo sistema de wizards
│   └── ...
├── lib/                    # Utilidades y configuraciones
├── hooks/                  # Custom hooks
├── prisma/                 # Schema de base de datos
├── scripts/                # Scripts de seeding y utilidades
└── public/                 # Archivos estáticos
```

---

## 4. Modelo de Datos (Schema Prisma)

### 4.1 Gestión de Usuarios

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuarios con roles (ADMIN, DEALER, RETAIL, VIP, WHOLESALE), información fiscal, direcciones de entrega y facturación |
| **Account** | Cuentas de autenticación (NextAuth) |
| **Session** | Sesiones activas |
| **DeliveryAddress** | Direcciones de entrega |
| **BillingAddress** | Direcciones de facturación |

### 4.2 Catálogo de Productos

| Modelo | Descripción |
|--------|-------------|
| **Category** | Categorías jerárquicas de productos |
| **Product** | Productos con dimensiones, precios, imágenes |
| **ProductLine** | Líneas de producto (VIDRIO, CERÁMICA, ALHÚ, SUPER MATE) |
| **ProductTone** | Tonos/colores dentro de cada línea |
| **DoorType** | Tipos de puerta |
| **DoorModel** | Modelos de puerta |
| **ColorTone** | Tonos de color |
| **WoodGrain** | Vetas de madera |
| **Material** | Materiales disponibles |
| **Hardware** | Herrajes (bisagras, rieles, etc.) |
| **Handle** | Jaladeras |
| **HandleModel** | Modelos específicos de jaladeras |
| **EdgeBanding** | Cantos (cubrecantos) |
| **ProductBackFace** | Traseras de puerta |

### 4.3 Sistema de Cotizaciones

| Modelo | Descripción |
|--------|-------------|
| **Quote** | Cotización completa con cliente, items, totales |
| **QuoteItem** | Items individuales de la cotización con personalización |
| **QuoteShare** | Compartir cotizaciones entre usuarios |
| **QuoteStatus** | Estados: DRAFT, PENDING, APPROVED, REJECTED, EXPIRED, SENT_TO_CLIENT, APPROVED_BY_CLIENT, PAID, IN_PRODUCTION, READY_FOR_DELIVERY, INVOICED, COMPLETED, CANCELLED |

### 4.4 Sistema de Wizard Configurable

| Modelo | Descripción |
|--------|-------------|
| **WizardTemplate** | Plantillas de wizard con pasos, pricing, validaciones |
| **WizardStepDefinition** | Definiciones de pasos (category-selection, dimensions, tone-selection, etc.) |
| **WizardAssignment** | Asignación de wizards a usuarios/roles |
| **WizardUsage** | Registro de uso de wizards |

### 4.5 Configuración

| Modelo | Descripción |
|--------|-------------|
| **CompanySettings** | Configuración de la empresa (logo, colores, moneda) |
| **TaxSettings** | Configuración de impuestos |
| **PricingFormula** | Fórmulas de cálculo de precios |
| **Notification** | Notificaciones de usuario |
| **AuditLog** | Logs de auditoría para compliance |

---

## 5. Sistema de Wizards (Configuradores)

### 5.1 Wizard Antiguo (KitWizard)

Sistema legado en `components/kit-wizard/` con pasos fijos:
- StepCategory - Selección de categoría
- StepLine - Selección de línea
- StepDimensions - Dimensiones
- StepTone / StepAltoBrilloTone / StepEuropeaTone - Selección de tono
- StepGrain - Selección de veta
- StepBackFace - Cara trasera
- StepEdgeBanding - Cantos
- StepHandle - Jaladera
- StepOptionals - Opciones adicionales
- StepSummary - Resumen

### 5.2 Wizard Nuevo (ConfigurableWizard)

Sistema moderno en `components/configurable-wizard/` basado en plantillas de base de datos:
- Plantillas definibles desde `/admin/wizard-templates`
- Pasos dinámicos según `stepDefinitionCode`
- Tipos de paso: category-selection, line-selection, dimensions, tone-selection, grain-selection, back-face-selection, edge-banding-selection, handle-selection, optionals, summary, custom
- Validaciones y cálculo de precios configurables

---

## 6. Rutas Principales

### 6.1 Páginas Públicas/Autenticación
- `/` - Página de inicio
- `/auth/signin` - Inicio de sesión

### 6.2 Dashboard y Gestión
- `/dashboard` - Dashboard del usuario
- `/products` - Catálogo de productos
- `/quotes` - Lista de cotizaciones
- `/quotes/[id]` - Ver cotización
- `/quotes/[id]/edit` - Editar cotización
- `/profile` - Perfil de usuario

### 6.3 Administración
- `/admin` - Panel de administración
- `/admin/products` - Gestión de productos
- `/admin/wizards` - Administración de wizards
- `/admin/wizard-step-definitions` - Definiciones de pasos

### 6.4 API Endpoints

| Endpoint | Descripción |
|----------|-------------|
| `/api/auth/[...nextauth]` | Autenticación |
| `/api/quotes` | CRUD de cotizaciones |
| `/api/quotes/[id]/items` | Items de cotización |
| `/api/products` | CRUD de productos |
| `/api/categories` | Categorías |
| `/api/users` | Gestión de usuarios |
| `/api/admin/*` | Endpoints administrativos |
| `/api/dashboard/stats` | Estadísticas |
| `/api/kit-config` | Configuración de kits |

---

## 7. Flujo de Trabajo

### 7.1 Creación de Cotización

1. Usuario inicia sesión
2. Accede a `/quotes` y crea nueva cotización
3. Agrega items usando el Wizard:
   - Selecciona línea de producto (Vidrio, Cerámica, Alhú, etc.)
   - Ingresa dimensiones (ancho, alto)
   - Selecciona tono/color
   - Configura opciones (cara trasera, canton, jaladera)
4. Sistema calcula precio basado en dimensiones y opciones
5. Genera PDF de la cotización

### 7.2 Sistema de Precios

- Precio base por metro cuadrado según línea y tono
- Descuentos por rol de usuario
- Cálculo automático de packaging según dimensiones
- Ajustes por opciones adicionales (2 caras, Express, Exhibición)

---

## 8. Componentes Principales

### UI Components (Shadcn)
- Button, Input, Select, Dialog, Dropdown, etc.
- Tabla de productos con filtros
- Formularios con validación

### Componentes de Negocio
- **QuoteCard** - Tarjeta de cotización
- **QuoteSummaryStats** - Estadísticas de cotización
- **ProductCard** - Tarjeta de producto
- **ProductsTable** - Tabla de productos
- **DimensionCalculator** - Calculadora de dimensiones
- **NotificationsDropdown** - Notificaciones

### Wizards
- **KitWizard** - Wizard antiguo de configuración
- **ConfigurableWizard** - Wizard nuevo dinámico

---

## 9. Configuración y Deployment

### Variables de Entorno
```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

### Comandos
```bash
npm run dev      # Desarrollo
npm run build    # Producción
npm run lint     # Linting
npm run db:seed  # Poblar base de datos
```

### Docker
```bash
docker compose up -d  # Iniciar servicios
```

---

## 10. Características Clave

1. **Gestión de Usuarios por Roles**
   - ADMIN: Acceso total
   - DEALER: Distribuidor
   - RETAIL: Venta minorista
   - VIP: Cliente VIP
   - WHOLESALE: Mayoreo

2. **Sistema de Descuentos**
   - Descuentos por rol de usuario
   - Límites de crédito

3. **Configuración de Productos**
   - Múltiples líneas de producto
   - Personalización de dimensiones
   - Opciones de tono, color, veta
   - Jaladeras y cantos

4. **Cotizaciones**
   - Estados múltiples
   - Adjuntos y pruebas de pago
   - Generación PDF
   - Fechas de validez y entrega

5. **Notificaciones**
   - Sistema de alertas
   - Marcar como leídas

---

## 11. Arquitectura de Datos

### Relaciones Clave

```
User (1) ──< Quote (1) ──< QuoteItem (N) ──< Product
                │
                └─< QuoteShare >─ User
                
ProductLine (1) ──< ProductTone (N)
Product (1) ──< Category

WizardTemplate (1) ──< WizardAssignment >─ User
WizardTemplate (1) ──< WizardUsage >─ User
```

---

## 12. Tecnologías Externas

- **Next.js 14**: Framework React con App Router
- **Prisma 6**: ORM para PostgreSQL
- **NextAuth.js**: Autenticación
- **Radix UI**: Primitivos de UI accesibles
- **Tailwind CSS**: Estilos utilitarios
- **SWR/TanStack Query**: Data fetching
- **React Hook Form + Zod**: Formularios
- **Zustand + Jotai**: Estado global

---

## 13. Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `scripts/seed.ts` | Seed principal de datos |
| `scripts/seed-kit-data.ts` | Datos de kits |
| `scripts/seed-europea.ts` | Línea europea |
| `scripts/seed-ceramica.ts` | Línea cerámica |
| `scripts/seed-alhu.ts` | Línea Alhú |
| `scripts/sync-catalog.ts` | Sincronización de catálogo |

---

## 14. Resumen

Cotizador MAD es una aplicación robusta y completa para la gestión de cotizaciones de mobiliario. Utiliza tecnologías modernas de Next.js con TypeScript, tiene una arquitectura bien organizada con separación clara entre UI, lógica de negocio y acceso a datos. El sistema soporta múltiples líneas de productos configurables, precios dinámicos basados en dimensiones y opciones, y un sistema de wizards tanto legacy como moderno para la guía del usuario.

El proyecto está bien estructurado para escalar y mantener, siguiendo las mejores prácticas de desarrollo con Next.js 14, TypeScript strict, y componentes reutilizables.
