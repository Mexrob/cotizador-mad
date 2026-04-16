# Skill: Consistencia de UI/UX (Design System)

Esta skill asegura que cada nuevo componente o página mantenga el estándar visual premium del proyecto.

## 1. Uso de Componentes Base
- Siempre prefiere componentes de `@/components/ui/` (Shadcn/UI).
- No crees estilos personalizados con CSS puro si puedes usar utilidades de Tailwind.
- Usa la utilidad `cn()` para combinar clases condicionales.

## 2. Tipografía y Espaciado
- Mantén la jerarquía de títulos (`h1`, `h2`, `h3`) establecida.
- Usa el sistema de espaciado estándar de Tailwind (ej: `space-y-4`, `p-6`, `gap-4`) para mantener la alineación.

## 3. Estado de Cargando y Vacío
- Cada acción asíncrona debe tener un estado visual de carga (`Skeleton` o un spinner).
- Define siempre un estado "vacío" para listas o tablas (ej: "No hay productos que coincidan con la búsqueda").

## 4. Formularios y Validaciones
- Usa **React Hook Form** + **Zod** para cada formulario.
- Los mensajes de error deben ser claros y aparecer justo debajo del campo afectado.
- Deshabilita el botón de envío (`disabled`) mientras la petición está en curso para evitar duplicados.
