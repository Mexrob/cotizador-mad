# Guía de Despliegue en VPS

Esta guía te ayudará a desplegar la aplicación Cotizador MAD en tu servidor VPS.

## Requisitos Previos

- Un servidor VPS con Ubuntu 20.04 o superior
- Acceso SSH al servidor
- Un dominio apuntando a la IP de tu servidor (opcional pero recomendado)
- Al menos 2GB de RAM
- Al menos 20GB de espacio en disco

## Paso 1: Preparar el Servidor

Conéctate a tu servidor VPS:

```bash
ssh root@tu-ip-del-servidor
```

## Paso 2: Descargar el Script de Despliegue

En tu servidor, descarga el script de despliegue:

```bash
cd /tmp
wget https://raw.githubusercontent.com/Mexrob/cotizador-mad/master/deploy.sh
chmod +x deploy.sh
```

O copia el archivo `deploy.sh` desde tu máquina local:

```bash
# Desde tu máquina local
scp deploy.sh root@tu-ip-del-servidor:/tmp/
```

## Paso 3: Ejecutar el Script de Despliegue

```bash
cd /tmp
sudo ./deploy.sh
```

El script te guiará a través del proceso y te pedirá:

1. **Configurar la base de datos PostgreSQL**
   - Sigue las instrucciones en pantalla para crear la base de datos
   
2. **Editar el archivo .env**
   - El script creará una plantilla
   - Deberás editar `/var/www/cotizador-mad/.env` con tus credenciales reales

3. **Confirmar la ejecución del seed** (opcional)
   - Esto creará datos de prueba en la base de datos

## Paso 4: Configurar Variables de Entorno

Edita el archivo `.env` en `/var/www/cotizador-mad/.env`:

```bash
nano /var/www/cotizador-mad/.env
```

Configura las siguientes variables:

```env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/cotizador_mad?schema=public"

# NextAuth
NEXTAUTH_URL="http://tu-dominio.com"
NEXTAUTH_SECRET="genera-un-secret-aleatorio-muy-largo-aqui"

# App
NODE_ENV="production"
PORT=3000
```

Para generar un `NEXTAUTH_SECRET` seguro:

```bash
openssl rand -base64 32
```

## Paso 5: Configurar Nginx

Edita la configuración de Nginx para usar tu dominio:

```bash
nano /etc/nginx/sites-available/cotizador-mad
```

Reemplaza `tu-dominio.com` con tu dominio real:

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reinicia Nginx:

```bash
systemctl restart nginx
```

## Paso 6: Configurar SSL con Let's Encrypt (Recomendado)

Instala Certbot:

```bash
apt-get install -y certbot python3-certbot-nginx
```

Obtén un certificado SSL:

```bash
certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

Certbot configurará automáticamente Nginx para usar HTTPS.

## Paso 7: Verificar el Despliegue

Verifica que la aplicación esté corriendo:

```bash
pm2 status
```

Ver los logs:

```bash
pm2 logs cotizador-mad
```

Accede a tu aplicación en el navegador:
- HTTP: `http://tu-dominio.com`
- HTTPS: `https://tu-dominio.com` (si configuraste SSL)

## Actualizaciones Futuras

Para actualizar la aplicación cuando hagas cambios:

1. **Desde tu máquina local**, sube los cambios a GitHub:
   ```bash
   git add .
   git commit -m "Descripción de cambios"
   git push origin master
   ```

2. **En el servidor**, ejecuta el script de actualización:
   ```bash
   cd /var/www/cotizador-mad
   ./update.sh
   ```

## Comandos Útiles

### PM2 (Gestión de Procesos)

```bash
# Ver estado de todas las aplicaciones
pm2 status

# Ver logs en tiempo real
pm2 logs cotizador-mad

# Ver logs de las últimas 100 líneas
pm2 logs cotizador-mad --lines 100

# Reiniciar la aplicación
pm2 restart cotizador-mad

# Detener la aplicación
pm2 stop cotizador-mad

# Iniciar la aplicación
pm2 start cotizador-mad

# Eliminar la aplicación de PM2
pm2 delete cotizador-mad

# Guardar configuración de PM2
pm2 save

# Ver uso de recursos
pm2 monit
```

### Nginx

```bash
# Verificar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx

# Ver estado de Nginx
systemctl status nginx

# Ver logs de Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Base de Datos PostgreSQL

```bash
# Conectarse a PostgreSQL
sudo -u postgres psql

# Conectarse a la base de datos específica
sudo -u postgres psql -d cotizador_mad

# Backup de la base de datos
pg_dump -U usuario cotizador_mad > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql -U usuario cotizador_mad < backup_20231201.sql
```

### Prisma

```bash
cd /var/www/cotizador-mad

# Ver estado de migraciones
npx prisma migrate status

# Crear nueva migración
npx prisma migrate dev --name nombre_migracion

# Aplicar migraciones en producción
npx prisma migrate deploy

# Regenerar cliente de Prisma
npx prisma generate

# Abrir Prisma Studio (interfaz visual)
npx prisma studio
```

## Backups Automáticos

Crea un script de backup automático:

```bash
nano /usr/local/bin/backup-cotizador.sh
```

Contenido:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cotizador-mad"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup de base de datos
pg_dump -U usuario cotizador_mad > $BACKUP_DIR/db_$DATE.sql

# Backup de archivos subidos (si los hay)
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/cotizador-mad/public/uploads

# Mantener solo los últimos 7 días de backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completado: $DATE"
```

Hazlo ejecutable:

```bash
chmod +x /usr/local/bin/backup-cotizador.sh
```

Configura un cron job para ejecutarlo diariamente:

```bash
crontab -e
```

Agrega esta línea para ejecutar el backup todos los días a las 2 AM:

```
0 2 * * * /usr/local/bin/backup-cotizador.sh >> /var/log/backup-cotizador.log 2>&1
```

## Monitoreo

### Configurar alertas de PM2

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoreo de recursos

Instala htop para monitoreo en tiempo real:

```bash
apt-get install -y htop
htop
```

## Solución de Problemas

### La aplicación no inicia

1. Verifica los logs:
   ```bash
   pm2 logs cotizador-mad --lines 50
   ```

2. Verifica que el puerto 3000 esté libre:
   ```bash
   netstat -tulpn | grep 3000
   ```

3. Verifica las variables de entorno:
   ```bash
   cat /var/www/cotizador-mad/.env
   ```

### Error de conexión a la base de datos

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   systemctl status postgresql
   ```

2. Verifica la cadena de conexión en `.env`

3. Prueba la conexión manualmente:
   ```bash
   sudo -u postgres psql -d cotizador_mad
   ```

### Nginx muestra error 502

1. Verifica que la aplicación esté corriendo:
   ```bash
   pm2 status
   ```

2. Verifica los logs de Nginx:
   ```bash
   tail -f /var/log/nginx/error.log
   ```

3. Verifica la configuración de Nginx:
   ```bash
   nginx -t
   ```

### Error de permisos

Asegúrate de que los archivos tengan los permisos correctos:

```bash
chown -R www-data:www-data /var/www/cotizador-mad
chmod -R 755 /var/www/cotizador-mad
```

## Seguridad Adicional

### Configurar Fail2Ban

Protege tu servidor de ataques de fuerza bruta:

```bash
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
```

### Actualizar el sistema regularmente

```bash
apt-get update
apt-get upgrade -y
apt-get autoremove -y
```

### Configurar firewall UFW

```bash
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw enable
ufw status
```

## Soporte

Si encuentras problemas durante el despliegue:

1. Revisa los logs de PM2: `pm2 logs cotizador-mad`
2. Revisa los logs de Nginx: `tail -f /var/log/nginx/error.log`
3. Verifica la configuración de la base de datos
4. Asegúrate de que todas las variables de entorno estén configuradas correctamente

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de PM2](https://pm2.keymetrics.io/docs/)
- [Documentación de Nginx](https://nginx.org/en/docs/)
- [Documentación de Prisma](https://www.prisma.io/docs)
