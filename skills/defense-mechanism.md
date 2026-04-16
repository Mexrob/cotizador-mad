# Skill: Sistema de Defensa y Blindaje de Código

Esta skill define el procedimiento estándar para proteger la lógica crítica de un proyecto mediante pruebas unitarias y reglas de gobernanza para IA.

## 1. Identificación de Lógica Crítica
Antes de escribir código, identifica los archivos que contienen:
- Cálculos financieros o de negocio.
- Esquemas de validación de datos.
- Motores de estado o flujos lógicos complejos.

## 2. Configuración de Infraestructura
Ejecuta los siguientes pasos para preparar el entorno de pruebas:

1. **Instalación de dependencias (Node/Yarn):**
   ```bash
   yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom
   ```

2. **Creación de `vitest.config.ts`:**
   ```typescript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';
   import path from 'path';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
     },
     resolve: {
       alias: { '@': path.resolve(__dirname, './') },
     },
   });
   ```

3. **Inclusión en `package.json`:**
   Añade `"test": "vitest"` a la sección de `scripts`.

## 3. Implementación de Pruebas de Blindaje
Crea archivos `.test.ts` para cada componente de lógica crítica.
- **Foco:** Validar entradas extremas, casos de error y resultados esperados en cálculos.
- **Formato:** Los archivos deben estar junto al código fuente o en un directorio centralizado.

## 4. Reglas de Gobernanza (AGENTS.md)
Inserta siempre lo siguiente en el archivo de instrucciones para la IA del proyecto:

```markdown
## Calidad y Estabilidad (Crucial)
- **Zero-Bugs Policy**: Cualquier cambio en la lógica [LISTA_DE_ARCHIVOS_CRITICOS] DEBE ir acompañado de la ejecución satisfactoria de los tests: `npm run test`.
- **No Refactoring**: No cambies lógica de negocio existente que ya funcione a menos que sea el objetivo principal de la tarea.
- **Strict Types**: Evita el uso de `any`.
```

## 5. Verificación
Un proyecto no se considera "blindado" hasta que:
1. `npm run test` pase al 100%.
2. Se haya verificado un fallo provocado (simular un error en el código y ver que el test lo detiene).
