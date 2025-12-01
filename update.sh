#!/bin/bash

# Script de actualización rápida
# Ejecutar este script cuando solo necesites actualizar el código

set -e

APP_DIR="/var/www/cotizador-mad"
PM2_APP_NAME="cotizador-mad"

echo "🔄 Actualizando Cotizador MAD..."

cd $APP_DIR

# 1. Obtener últimos cambios
echo "📥 Descargando últimos cambios..."
git fetch origin
git reset --hard origin/master
git pull origin master

# 2. Instalar/actualizar dependencias
echo "📦 Actualizando dependencias..."
npm ci --production=false

# 3. Ejecutar migraciones de base de datos
echo "🗄️  Ejecutando migraciones..."
npx prisma generate
npx prisma migrate deploy

# 4. Reconstruir aplicación
echo "🏗️  Reconstruyendo aplicación..."
npm run build

# 5. Reiniciar aplicación
echo "🔄 Reiniciando aplicación..."
pm2 restart $PM2_APP_NAME

# 6. Mostrar estado
echo ""
echo "✅ Actualización completada"
pm2 status
pm2 logs $PM2_APP_NAME --lines 20
