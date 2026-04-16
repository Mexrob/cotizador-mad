# 🐳 Despliegue Rápido con Docker

## Inicio Rápido (5 minutos)

```bash
# 1. Configurar variables de entorno
cp .env.docker .env
nano .env  # Edita POSTGRES_PASSWORD y NEXTAUTH_SECRET

# 2. Desplegar
chmod +x docker-deploy.sh
./docker-deploy.sh

# 3. Acceder
# http://localhost:3000
```

## Comandos Esenciales

```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f app

# Reiniciar
docker-compose restart app

# Detener
docker-compose down

# Backup
./docker-backup.sh
```

## 📚 Documentación Completa

Ver [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) para:
- Instalación detallada
- Configuración de producción
- SSL/HTTPS
- Backups automáticos
- Solución de problemas

## 🎯 Estructura

- `Dockerfile` - Imagen de la aplicación
- `docker-compose.yml` - Orquestación de servicios
- `.env.docker` - Plantilla de variables de entorno
- `docker-deploy.sh` - Script de despliegue
- `docker-backup.sh` - Script de backup
- `nginx/nginx.conf` - Configuración de Nginx

## 🔐 Seguridad

Antes de producción:
1. Cambia `POSTGRES_PASSWORD` a una contraseña segura
2. Genera `NEXTAUTH_SECRET`: `openssl rand -base64 32`
3. Actualiza `NEXTAUTH_URL` con tu dominio
4. Configura SSL/HTTPS

## 📊 Health Check

```bash
curl http://localhost:3000/api/health
```

## 🆘 Problemas Comunes

**Error de conexión a BD:**
- Verifica que `DATABASE_URL` use `postgres` como host (no `localhost`)

**Puerto en uso:**
- Cambia el puerto en `docker-compose.yml`

**Migraciones fallan:**
```bash
docker-compose exec app npx prisma migrate deploy
```

---

¿Necesitas ayuda? Consulta [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
