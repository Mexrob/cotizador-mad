# 🚀 Despliegue Rápido - Cotizador MAD

## Opción 1: Despliegue Automático (Recomendado)

### En tu servidor VPS:

```bash
# 1. Conectarse al servidor
ssh root@tu-ip-del-servidor

# 2. Descargar y ejecutar el script de despliegue
cd /tmp
wget https://raw.githubusercontent.com/Mexrob/cotizador-mad/master/deploy.sh
chmod +x deploy.sh
sudo ./deploy.sh
```

El script instalará automáticamente:
- ✅ Node.js 20
- ✅ PostgreSQL
- ✅ Nginx
- ✅ PM2
- ✅ Configuración de firewall
- ✅ La aplicación completa

## Opción 2: Despliegue Manual

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para instrucciones detalladas paso a paso.

## Después del Despliegue

### 1. Configurar Variables de Entorno

Edita `/var/www/cotizador-mad/.env`:

```bash
nano /var/www/cotizador-mad/.env
```

Usa `.env.production.example` como referencia.

### 2. Configurar tu Dominio

Edita `/etc/nginx/sites-available/cotizador-mad` y reemplaza `tu-dominio.com` con tu dominio real.

### 3. Configurar SSL (Recomendado)

```bash
apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

## Actualizaciones

Para actualizar la aplicación después de hacer cambios:

```bash
cd /var/www/cotizador-mad
./update.sh
```

## Comandos Útiles

```bash
# Ver estado de la aplicación
pm2 status

# Ver logs en tiempo real
pm2 logs cotizador-mad

# Reiniciar aplicación
pm2 restart cotizador-mad

# Ver estado de Nginx
systemctl status nginx
```

## Estructura de Archivos de Despliegue

- `deploy.sh` - Script de despliegue inicial completo
- `update.sh` - Script de actualización rápida
- `ecosystem.config.js` - Configuración de PM2
- `.env.production.example` - Ejemplo de variables de entorno
- `DEPLOYMENT.md` - Documentación completa de despliegue

## Soporte

Para problemas o preguntas, consulta [DEPLOYMENT.md](./DEPLOYMENT.md) que incluye:
- Solución de problemas comunes
- Configuración de backups
- Monitoreo y mantenimiento
- Seguridad adicional

## Requisitos del Servidor

- Ubuntu 20.04 o superior
- Mínimo 2GB RAM
- Mínimo 20GB disco
- Acceso root/sudo
