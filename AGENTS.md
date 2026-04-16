# AGENTS.md

## Critical Workflow: Database
- **ALWAYS run `npx prisma generate` after modifying `prisma/schema.prisma`**. Failure to do so causes runtime errors.
- Database seeding: `npm run db:seed`.
- Database studio: `npx prisma studio`.

## Creating New Cotizadores (Crucial)
1. **Never edit existing templates**: If you need a new flow, duplicate the existing one in `/admin/wizard-templates`.
2. **Assign Unique Codes**: Each cotizador must have a unique `templateCode` in the database.
3. **Verify Links**: Check `app/quotes/[id]/page.tsx` to ensure the correct `wizardTemplateCode` is being passed for the specific quote.
4. **Isolated Testing**: Test new flows using a unique `templateCode` to prevent overwriting global configuration.

## Calidad y Estabilidad (Crucial)
- **Zero-Bugs Policy**: Cualquier cambio en la lógica de cálculo (`lib/pricing.ts`), validación (`lib/validationSchemas.ts`) o estado del wizard (`lib/wizard-base/`) **DEBE** ir acompañado de la ejecución satisfactoria de los tests: `npm run test`.
- **No Refactoring**: No cambies lógica de negocio existente que ya funcione a menos que sea el objetivo principal de la tarea.
- **Strict Types**: Evita el uso de `any`. Si encuentras uno, intenta tiparlo correctamente.

1. **Old KitWizard**: Legacy (`components/kit-wizard/`).
2. **ConfigurableWizard**: Dynamic, template-driven (`components/configurable-wizard/`).
   - Templates managed in `/admin/wizard-templates`.
   - Steps driven by `stepDefinitionCode`.
   - Assignments: `/api/admin/wizard-assignments` (GET templateId, DELETE).

## Architecture & Conventions
- **App Router**: Next.js 14.
- **State**: Zustand (global), TanStack Query (server).
- **Forms**: React Hook Form + Zod.
- **Styling**: Tailwind CSS + Shadcn/UI (use `cn()` utility).
- **Imports**: Use `@/` alias. Group by: React, Next.js, External, Internal.

## Commands
- **Dev**: `npm run dev`
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Migrations**: `npx prisma migrate deploy`
- **Docker**: `docker compose up -d`
