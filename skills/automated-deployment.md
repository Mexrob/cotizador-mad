# Skill: Automated Deployment (Docker & Scripts)

Esta skill asegura que el despliegue del proyecto sea repetible, rápido y libre de errores manuales.

## 1. Mantenimiento de Docker
- El archivo `docker-compose.yml` debe ser la fuente de verdad para el entorno de producción.
- Asegúrate de que las imágenes se construyan con la versión correcta de Node especificada en `package.json`.
- Usa volúmenes para persistir la base de datos y los archivos subidos.

## 2. Flujo de Despliegue Local (`deploy.sh`)
Antes de ejecutar el script de despliegue:
1. Pasa todos los tests localmente: `npm run test`.
2. Verifica que no haya errores de compilación: `npm run build`.
3. Haz un commit y push de tus cambios.

## 3. Comprobaciones de Salud (Health Checks)
- Tras el despliegue, verifica que el contenedor de la aplicación esté corriendo con `docker compose ps`.
- Accede a la URL del sitio y verifica que el login y la carga del catálogo funcionen.

## 4. Gestión de Secretos en Despliegue
- Nunca incluyas archivos `.env` en el repositorio de Git.
- Usa un archivo `.env.production` en el servidor vps o un gestor de secretos.
- Asegúrate de que la `DATABASE_URL` apunte al contenedor correcto de la base de datos.
