# Skill: Feedback Visual y Micro-interacciones

Esta skill define cómo el sistema debe comunicarse visualmente con el usuario ante cada acción, eliminando la incertidumbre y mejorando la percepción de fluidez (Perceived Performance).

## 1. Principio de Feedback Inmediato
Toda acción iniciada por el usuario (clics, envíos, cambios) debe producir una respuesta visual instantánea (< 100ms).
- **Navegación**: Mostrar un spinner en el botón si el destino es una página compleja.
- **Acciones Asíncronas**: Mostrar cambios de estado (deshabilitado + icono de carga) mientras se procesa la petición.

## 2. Patrones de "Cargando" (Loading States)
- **Botones**: Usa el componente `Button` de Shadcn con el icono `Loader2` o `RefreshCw` de `lucide-react` con la clase `animate-spin`.
- **Listas y Tablas**: Implementa `Skeleton` de Shadcn si la carga es inicial.
- **Transiciones**: Si la transición es entre rutas, usa barras de progreso superiores o spinners centrados si el componente tarda en montar.

## 3. Prevención de Acciones Duplicadas
- **Deshabilitar**: Todo botón que inicie una mutación (POST, PUT, DELETE) o una navegación lenta debe quedar en estado `disabled={loading}`.
- **Feedback Multibotón**: Si hay varios botones de acción (ej: cabecera de cotización), deshabilita todos mientras uno esté en proceso para evitar conflictos de estado.

## 4. Notificaciones de Éxito y Error
- Usa `toast` (Sonner o Shadcn Toast) para confirmar el resultado de cada acción destructiva o significativa (ej: duplicar, eliminar, guardar cambios).
- **Variante Destructive**: Usa siempre para errores fatales.
- **Variante Success**: Usa para operaciones que ocurran fuera de la vista inmediata del usuario (ej: "PDF generado").

## 5. Micro-animaciones (Framer Motion)
- Usa `motion.div` para suavizar la aparición de nuevos items en listas o la apertura de modales.
- Mantén duraciones cortas (0.2s - 0.3s) y curvas suaves (`easeOut`) para que se sienta fluido pero profesional.
