# Skill: Gestión Segura de Base de Datos (Prisma)

Esta skill define el flujo de trabajo para mantener la integridad de la base de datos y facilitar la colaboración.

## 1. Modificación del Esquema
Siempre que se modifique `prisma/schema.prisma`:
1. **Validación:** Ejecuta `npx prisma validate`.
2. **Migración Local:** Crea la migración con `npx prisma migrate dev --name descripcion_cambio`.
3. **Generación:** El sistema debe ejecutar automáticamente `npx prisma generate` (asegúrate de que esté en los hooks o ejecútalo manualmente).

## 2. Estrategia de Seeding
El seeding debe ser idempotente (puede ejecutarse varias veces sin duplicar datos).
- Usa `upsert` en lugar de `create` siempre que sea posible.
- Ejecuta `npm run db:seed` para sincronizar datos base (categorías, roles, productos iniciales).

## 3. Cambios Rompibles (Breaking Changes)
Si el cambio de esquema implica borrar una columna con datos:
1. Crea una nueva columna opcional.
2. Crea un script de migración de datos (en `scripts/`) para mover los valores.
3. Borra la columna antigua en una migración posterior.

## 4. Inspección Visual
Usa `npx prisma studio` para verificar rápidamente que los datos se están guardando con el formato y relaciones esperadas.
