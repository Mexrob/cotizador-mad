# 🐳 Guía de Despliegue con Docker - Cotizador MAD

Esta guía te ayudará a desplegar el Cotizador MAD usando Docker y Docker Compose.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación Rápida](#instalación-rápida)
- [Configuración Detallada](#configuración-detallada)
- [Comandos Útiles](#comandos-útiles)
- [Despliegue en Producción](#despliegue-en-producción)
- [Backups](#backups)
- [Solución de Problemas](#solución-de-problemas)

---

## 📦 Requisitos Previos

### En tu máquina local o servidor:

- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Git** (para clonar el repositorio)
- Mínimo **2GB RAM** disponible
- Mínimo **10GB** de espacio en disco

### Instalar Docker

#### Ubuntu/Debian:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### macOS:
Descarga [Docker Desktop](https://www.docker.com/products/docker-desktop)

#### Windows:
Descarga [Docker Desktop](https://www.docker.com/products/docker-desktop)

---

## 🚀 Instalación Rápida

### 1. Clonar el repositorio (si aún no lo tienes)

```bash
git clone https://github.com/Mexrob/cotizador-mad.git
cd cotizador-mad
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.docker .env

# Editar el archivo .env con tus credenciales
nano .env  # o usa tu editor favorito
```

**IMPORTANTE:** Debes configurar:
- `POSTGRES_PASSWORD` - Una contraseña segura para PostgreSQL
- `NEXTAUTH_SECRET` - Genera uno con: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Tu dominio en producción (ej: https://tudominio.com)

### 3. Ejecutar el script de despliegue

```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

¡Eso es todo! Tu aplicación estará disponible en `http://localhost:3000`

---

## ⚙️ Configuración Detallada

### Estructura de Archivos Docker

```
cotizador-mad/
├── Dockerfile              # Imagen de la aplicación Next.js
├── docker-compose.yml      # Orquestación de servicios
├── .dockerignore          # Archivos excluidos del build
├── .env.docker            # Plantilla de variables de entorno
├── docker-deploy.sh       # Script de despliegue automático
├── docker-backup.sh       # Script de backup de BD
└── nginx/
    └── nginx.conf         # Configuración de Nginx (opcional)
```

### Variables de Entorno

Edita el archivo `.env`:

```bash
# PostgreSQL
POSTGRES_USER=cotizador
POSTGRES_PASSWORD=TuPasswordSeguro123!
POSTGRES_DB=cotizador_mad

# Database URL
DATABASE_URL=postgresql://cotizador:TuPasswordSeguro123!@postgres:5432/cotizador_mad?schema=public

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu-secret-generado-con-openssl

# Application
NODE_ENV=production
PORT=3000
```

### Servicios en Docker Compose

El archivo `docker-compose.yml` define 3 servicios:

1. **postgres** - Base de datos PostgreSQL 16
2. **app** - Aplicación Next.js
3. **nginx** - Reverse proxy (opcional)

---

## 🎮 Comandos Útiles

### Gestión de Contenedores

```bash
# Ver estado de los contenedores
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f app
docker-compose logs -f postgres

# Reiniciar un servicio
docker-compose restart app

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ CUIDADO: Borra la BD)
docker-compose down -v

# Reconstruir la imagen
docker-compose build --no-cache app

# Iniciar servicios
docker-compose up -d
```

### Acceder a los Contenedores

```bash
# Acceder al contenedor de la app
docker-compose exec app sh

# Acceder a PostgreSQL
docker-compose exec postgres psql -U cotizador -d cotizador_mad

# Ejecutar comandos de Prisma
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate deploy
```

### Monitoreo

```bash
# Ver uso de recursos
docker stats

# Ver logs de un servicio específico
docker-compose logs --tail=100 app

# Verificar health check
curl http://localhost:3000/api/health
```

---

## 🌐 Despliegue en Producción

### Opción 1: VPS (DigitalOcean, Linode, Hetzner)

#### 1. Conectarse al servidor

```bash
ssh root@tu-ip-del-servidor
```

#### 2. Instalar Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

#### 3. Clonar el repositorio

```bash
cd /var/www
git clone https://github.com/Mexrob/cotizador-mad.git
cd cotizador-mad
```

#### 4. Configurar variables de entorno

```bash
cp .env.docker .env
nano .env  # Editar con tus credenciales de producción
```

#### 5. Desplegar

```bash
chmod +x docker-deploy.sh
./docker-deploy.sh
```

#### 6. Configurar dominio y SSL

Edita `nginx/nginx.conf` y reemplaza `localhost` con tu dominio.

Para SSL con Let's Encrypt:

```bash
# Instalar certbot
apt-get update
apt-get install -y certbot

# Generar certificados
certbot certonly --standalone -d tudominio.com -d www.tudominio.com

# Copiar certificados a nginx/ssl/
mkdir -p nginx/ssl
cp /etc/letsencrypt/live/tudominio.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/tudominio.com/privkey.pem nginx/ssl/

# Descomentar la configuración SSL en nginx/nginx.conf
# Reiniciar Nginx
docker-compose restart nginx
```

### Opción 2: AWS ECS / Google Cloud Run

Sube la imagen a un registry:

```bash
# Construir imagen
docker build -t cotizador-mad:latest .

# Tag para tu registry
docker tag cotizador-mad:latest tu-registry/cotizador-mad:latest

# Push
docker push tu-registry/cotizador-mad:latest
```

### Opción 3: Render.com / Fly.io

Estos servicios detectan automáticamente el `Dockerfile` y lo despliegan.

---

## 💾 Backups

### Backup Manual

```bash
# Ejecutar script de backup
./docker-backup.sh
```

Los backups se guardan en `./backups/` con formato `backup-YYYYMMDD-HHMMSS.sql.gz`

### Backup Automático con Cron

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2 AM
0 2 * * * cd /var/www/cotizador-mad && ./docker-backup.sh >> /var/log/cotizador-backup.log 2>&1
```

### Restaurar Backup

```bash
# Descomprimir backup
gunzip backups/backup-20241202-140000.sql.gz

# Restaurar
docker-compose exec -T postgres psql -U cotizador -d cotizador_mad < backups/backup-20241202-140000.sql
```

---

## 🔧 Solución de Problemas

### La aplicación no inicia

```bash
# Ver logs detallados
docker-compose logs app

# Verificar que PostgreSQL esté listo
docker-compose exec postgres pg_isready -U cotizador

# Reiniciar servicios
docker-compose restart
```

### Error de migraciones de Prisma

```bash
# Ejecutar migraciones manualmente
docker-compose exec app npx prisma migrate deploy

# Regenerar Prisma Client
docker-compose exec app npx prisma generate
```

### Error de conexión a la base de datos

Verifica que el `DATABASE_URL` en `.env` use `postgres` como host (no `localhost`):

```
DATABASE_URL=postgresql://cotizador:password@postgres:5432/cotizador_mad?schema=public
```

### Problemas de permisos con uploads

```bash
# Dar permisos al directorio de uploads
docker-compose exec app chown -R nextjs:nodejs /app/public/uploads
```

### La imagen es muy grande

El Dockerfile usa multi-stage build optimizado. La imagen final debería ser ~200-300MB.

```bash
# Ver tamaño de la imagen
docker images cotizador-mad

# Limpiar imágenes antiguas
docker image prune -a
```

### Puerto 3000 ya en uso

Cambia el puerto en `docker-compose.yml`:

```yaml
services:
  app:
    ports:
      - "8080:3000"  # Usar puerto 8080 en lugar de 3000
```

---

## 📊 Monitoreo en Producción

### Health Check

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-02T16:00:00.000Z",
  "services": {
    "database": "connected",
    "application": "running"
  }
}
```

### Logs

```bash
# Ver logs de aplicación
docker-compose logs -f --tail=100 app

# Ver logs de PostgreSQL
docker-compose logs -f --tail=100 postgres

# Buscar errores
docker-compose logs app | grep ERROR
```

---

## 🚀 Actualización de la Aplicación

```bash
# 1. Hacer backup
./docker-backup.sh

# 2. Detener servicios
docker-compose down

# 3. Actualizar código
git pull origin master

# 4. Reconstruir imagen
docker-compose build --no-cache app

# 5. Iniciar servicios
docker-compose up -d

# 6. Verificar migraciones
docker-compose exec app npx prisma migrate deploy
```

---

## 📞 Soporte

Para problemas o preguntas:
- Revisa los logs: `docker-compose logs -f`
- Verifica el health check: `curl http://localhost:3000/api/health`
- Consulta la documentación de Docker: https://docs.docker.com

---

## 🎯 Checklist de Producción

- [ ] Variables de entorno configuradas en `.env`
- [ ] `NEXTAUTH_SECRET` generado con `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` apunta a tu dominio de producción
- [ ] Contraseña de PostgreSQL segura
- [ ] SSL configurado (HTTPS)
- [ ] Backups automáticos configurados
- [ ] Firewall configurado (puertos 80, 443)
- [ ] Dominio apuntando al servidor
- [ ] Health check funcionando
- [ ] Logs monitoreados

---

¡Listo! Tu aplicación debería estar corriendo con Docker. 🎉
