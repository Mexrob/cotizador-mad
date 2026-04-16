# Skill: Optimización de Rendimiento (Next.js)

Esta skill establece las pautas para mantener la aplicación rápida y fluida, especialmente al manejar catálogos extensos.

## 1. Carga de Imágenes
- Usa siempre el componente `next/image`.
- Proporciona `width` y `height` o usa `fill` para evitar "Layout Shift".
- Configura `priority` para las imágenes que aparecen en la parte superior del cotizador (hero images).

## 2. Estrategias de Caching de API
- Para el catálogo de productos, usa `revalidate` en `fetch` o etiquetas de caché (Tags) para invalidar solo cuando sea necesario.
- Evita llamadas repetitivas a la base de datos dentro de bucles; usa `include` de Prisma para traer datos relacionados en una sola consulta.

## 3. División de Código (Code Splitting)
- Los componentes pesados del wizard (ej: selectores 3D o gráficos de Recharts) deben cargarse con `dynamic` de Next.js (`ssr: false` si es necesario).
- Esto reduce el tamaño del bundle inicial y acelera la primera carga.

## 4. Optimización de Estado en Wizards
- No almacenes datos masivos en el estado de React si no son necesarios para el renderizado inmediato.
- Usa `useMemo` para cálculos pesados derivados del estado (ej: sumatorias complejas de cotización) para evitar re-procesamientos innecesarios en cada tecla pulsada.
