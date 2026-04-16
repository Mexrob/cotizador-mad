# Skill: API Security & Resilience

Esta skill define cómo exponer datos de forma segura y manejar errores sin comprometer la estabilidad del servidor.

## 1. Validación de Entrada
- Todo endpoint debe validar el `body` o `query` usando un esquema de **Zod** antes de procesar nada.
- Si la validación falla, devuelve un código `400 Bad Request` inmediatamente.

## 2. Control de Acceso (RBAC)
- Antes de realizar una operación de escritura (POST, PUT, DELETE), verifica el rol del usuario (`ADMIN`, `WHOLESALE`, etc.).
- No confíes en los IDs que vienen del cliente; verifica que el recurso pertenece al usuario (ej: al editar una cotización).

## 3. Manejo de Errores Global
- Envuelve la lógica de la API en bloques `try...catch`.
- Registra el error en el servidor pero devuelve un mensaje amigable al cliente (no expongas stacks de error o consultas SQL directas).
- Usa códigos de estado HTTP correctos: `401` (No autenticado), `403` (Sin permisos), `404` (No encontrado).

## 4. Protección de Fórmulas de Negocio
- Realiza siempre los cálculos finales de precios en el servidor, nunca confíes en el precio calculado por el cliente en el navegador.
- Los secretos o llaves de API externas deben estar en variables de entorno (`.env`) y cargarse con `process.env`.
