# Cotizador MAD

## Documentación

Ver archivos en la raíz del proyecto:

- **README.md** - Este archivo
- **TECHNICAL_DOC.md** - Documentación técnica completa
- **WIZARDS_GUIDE.md** - Guía de cotizadores (wizards)
- **AGENTS.md** - Guía para agentes IA
- **IMPLEMENTATION_SUMMARY.md** - Resumen de implementación

---

## Descripción del Proyecto

**Cotizador MAD** es una aplicación web robusta y completa diseñada para la gestión eficiente de cotizaciones, productos y usuarios. Desarrollada con Next.js, esta plataforma ofrece una solución integral para empresas que necesitan generar y administrar cotizaciones de manera ágil, así como mantener un control detallado sobre su catálogo de productos y la administración de usuarios.

## Características Principales

*   **Gestión de Cotizaciones**:
    *   Creación, edición y eliminación de cotizaciones.
    *   Duplicación de cotizaciones existentes para agilizar el proceso.
    *   Generación de documentos PDF de cotizaciones para impresión o envío.
    *   Gestión de ítems dentro de cada cotización.
    *   Acciones masivas para cotizaciones (ej. eliminación, cambio de estado).
*   **Gestión de Productos**:
    *   Creación, edición y eliminación de productos con detalles completos.
    *   Carga de imágenes de productos.
    *   Organización de productos por categorías.
    *   Tabla de productos con filtros y búsqueda.
*   **Gestión de Usuarios**:
    *   Administración de usuarios con diferentes roles (ej. administrador, usuario regular).
    *   Activación/desactivación de usuarios.
    *   Gestión de permisos y roles de usuario.
*   **Autenticación Segura**:
    *   Sistema de autenticación robusto basado en NextAuth.js.
    *   Página de inicio de sesión dedicada.
*   **Panel de Control (Dashboard)**:
    *   Estadísticas y métricas clave para una visión general del negocio.
*   **Configuración de la Empresa**:
    *   Gestión de la información de la empresa, incluyendo la carga del logo.
*   **API RESTful**:
    *   Endpoints API para la gestión de cotizaciones, productos, categorías, usuarios y subidas de archivos.
*   **Interfaz de Usuario Intuitiva**:
    *   Diseño moderno y responsivo construido con Tailwind CSS y componentes de Shadcn UI.
*   **Base de Datos Relacional**:
    *   Utiliza Prisma como ORM para una interacción eficiente y segura con la base de datos.

## Tecnologías Utilizadas

*   **Frontend**:
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [React](https://react.dev/)
    *   [Tailwind CSS](https://tailwindcss.com/) (Framework CSS)
    *   [Shadcn UI](https://ui.shadcn.com/) (Componentes de UI)
*   **Backend**:
    *   [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
    *   [NextAuth.js](https://next-auth.js.org/) (Autenticación)
    *   [Prisma](https://www.prisma.io/) (ORM para base de datos)
    *   [bcryptjs](https://www.npmjs.com/package/bcryptjs) (Hashing de contraseñas)
    *   [Zod](https://zod.dev/) (Validación de esquemas)
    *   [SWR](https://swr.vercel.app/) (Data fetching)
*   **Base de Datos**:
    *   PostgreSQL (o cualquier base de datos compatible con Prisma)
*   **Herramientas de Desarrollo**:
    *   TypeScript
    *   Yarn (Gestor de paquetes)

## Configuración y Ejecución Local

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local:

### 1. Clonar el Repositorio

```bash
git clone https://github.com/Mexrob/cotizador-mad.git
cd cotizador-mad
```

### 2. Instalar Dependencias

```bash
yarn install
```

### 3. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto y configura las siguientes variables. Puedes usar `.env.example` como plantilla.

```
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase?schema=public"
NEXTAUTH_SECRET="YOUR_NEXTAUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"
```

*   `DATABASE_URL`: URL de conexión a tu base de datos.
*   `NEXTAUTH_SECRET`: Una cadena aleatoria larga y compleja para la seguridad de NextAuth. Puedes generarla con `openssl rand -base64 32`.
*   `NEXTAUTH_URL`: La URL base de tu aplicación (para desarrollo, `http://localhost:3000`).

### 4. Configurar la Base de Datos

Aplica las migraciones de Prisma para configurar tu base de datos:

```bash
npx prisma migrate dev --name initial_schema
```

### 5. Generar Cliente Prisma

```bash
npx prisma generate
```

### 6. Sembrar la Base de Datos (Opcional)

Si deseas poblar la base de datos con datos de ejemplo, ejecuta el script de siembra:

```bash
yarn ts-node scripts/seed.ts
```

### 7. Ejecutar la Aplicación

```bash
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`.

## Uso

Una vez que la aplicación esté en funcionamiento, puedes:

*   Acceder al panel de administración en `/admin`.
*   Explorar la gestión de productos en `/products`.
*   Crear y gestionar cotizaciones en `/quotes`.
*   Configurar los ajustes de la empresa en `/api/settings/company`.

## Contribuciones

Las contribuciones son bienvenidas. Por favor, abre un "issue" o envía un "pull request" con tus mejoras.

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.