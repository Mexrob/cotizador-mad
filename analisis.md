# Análisis del Proyecto: Cotizador MAD

## 📋 Descripción General

Aplicación web empresarial para la gestión de cotizaciones de muebles/mobiliario, construida con Next.js 14, TypeScript y PostgreSQL.

---

## 🏗️ Arquitectura Tecnológica

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Lenguaje** | TypeScript 5.2 |
| **Estilos** | Tailwind CSS + Shadcn UI |
| **Base de Datos** | PostgreSQL |
| **ORM** | Prisma 6.7 |
| **Auth** | NextAuth.js 4.24 |
| **Estado** | Zustand + TanStack Query |
| **Validación** | Zod |

---

## 📁 Estructura del Proyecto

```
/home/ubuntu/cotizador-mad/
├── app/                    # Next.js App Router
│   ├── admin/             # Panel de administración
│   ├── api/               # API Routes (16 endpoints)
│   ├── auth/              # Autenticación
│   ├── dashboard/         # Panel principal
│   ├── products/          # Gestión de productos
│   ├── quotes/            # Gestión de cotizaciones
│   └── uploads/           # Manejo de archivos
├── components/            # 30+ componentes React
│   └── ui/               # Componentes base Shadcn
├── lib/                   # Utilidades y tipos
├── prisma/               # Esquema y seeds
└── hooks/                # Custom hooks
```

---

## 🗄️ Modelos de Datos Principales (22 tablas)

### Core:
- `User` (roles: ADMIN, DEALER, RETAIL, VIP, WHOLESALE)
- `Quote` (12 estados: DRAFT → COMPLETED)
- `Product` + `Category`
- `CompanySettings`

### Configuración de Productos:
- `ProductLine` (VIDRIO, CERÁMICA, ALHÚ)
- `ProductTone` + `ColorTone`
- `DoorType` + `DoorModel`
- `WoodGrain` + `HandleModel`
- `EdgeBanding` + `ProductBackFace`

---

## 🔌 Endpoints API

| Módulo | Rutas |
|--------|-------|
| Auth | `/api/auth/*` (NextAuth) |
| Cotizaciones | `/api/quotes/*` |
| Productos | `/api/products/*` |
| Categorías | `/api/categories/*` |
| Usuarios | `/api/users/*`, `/api/admin/*` |
| Configuración | `/api/settings/*`, `/api/product-lines/*` |
| Notificaciones | `/api/notifications/*` |
| Uploads | `/api/upload/*` |
| Health Check | `/api/health` |

---

## ✨ Características Destacadas

### 1. Sistema de Cotizaciones Completo
- Configuración guiada de productos
- Cálculo de precios por m²
- Estados del workflow completo
- Compartir cotizaciones

### 2. Configurador de Productos
- Líneas de producto (VIDRIO, CERÁMICA)
- Tonos y colores
- Vetas (horizontal/vertical)
- Jaladeras y cubrecantos

### 3. Gestión de Usuarios Avanzada
- 5 roles diferentes
- Direcciones de envío/facturación
- Descuentos por rol
- Límites de crédito

### 4. Panel de Administración
- Dashboard con métricas
- Gestión de categorías
- Configuración de tonos/líneas
- Auditoría de cambios

---

## 🚀 Scripts Disponibles

```bash
yarn dev          # Desarrollo
yarn build        # Producción
yarn lint         # ESLint
yarn db:seed      # Seed de datos
```

---

## 📊 Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Dependencias | 70+ |
| Modelos Prisma | 22 |
| Endpoints API | ~16 |
| Componentes UI | 30+ |
| Tablas DB | 25+ |
| Líneas de código | ~15,000+ |

---

## ⚠️ Observaciones

### ✅ Puntos fuertes:
- Arquitectura moderna y escalable
- Tipado estricto con TypeScript
- UI con Shadcn/UI consistente
- Sistema de precios flexible
- Soporte multi-rol

### 🔧 Áreas de mejora:
- No tiene tests configurados
- Dockerfile/docker-compose no visible
- Falta CI/CD pipeline
- No hay documentación API (Swagger/OpenAPI)

---

## 📝 Conclusión

Proyecto empresarial maduro y bien estructurado para la industria del mobiliario, con arquitectura moderna y completa funcionalidad de cotización.

---

*Análisis generado el: 2026-02-16*
