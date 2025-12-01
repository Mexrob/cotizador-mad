#!/bin/bash

# Script de despliegue para VPS
# Este script debe ejecutarse en el servidor VPS

set -e  # Detener en caso de error

echo "🚀 Iniciando despliegue de Cotizador MAD..."

# Configuración
APP_NAME="cotizador-mad"
APP_DIR="/var/www/$APP_NAME"
REPO_URL="https://github.com/Mexrob/cotizador-mad.git"
NODE_VERSION="20"
PM2_APP_NAME="cotizador-mad"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Verificar que estamos ejecutando como root o con sudo
if [ "$EUID" -ne 0 ]; then 
    echo_error "Por favor ejecuta este script como root o con sudo"
    exit 1
fi

# 1. Actualizar sistema
echo "📦 Actualizando sistema..."
apt-get update
apt-get upgrade -y
echo_success "Sistema actualizado"

# 2. Instalar dependencias del sistema
echo "📦 Instalando dependencias del sistema..."
apt-get install -y curl git build-essential nginx postgresql postgresql-contrib
echo_success "Dependencias instaladas"

# 3. Instalar Node.js usando nvm (para el usuario que ejecutará la app)
echo "📦 Instalando Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
    apt-get install -y nodejs
    echo_success "Node.js instalado"
else
    echo_success "Node.js ya está instalado"
fi

# 4. Instalar PM2 globalmente
echo "📦 Instalando PM2..."
npm install -g pm2
echo_success "PM2 instalado"

# 5. Crear directorio de la aplicación
echo "📁 Creando directorio de la aplicación..."
mkdir -p $APP_DIR
cd $APP_DIR
echo_success "Directorio creado: $APP_DIR"

# 6. Clonar o actualizar repositorio
if [ -d ".git" ]; then
    echo "🔄 Actualizando repositorio..."
    git fetch origin
    git reset --hard origin/master
    git pull origin master
    echo_success "Repositorio actualizado"
else
    echo "📥 Clonando repositorio..."
    git clone $REPO_URL .
    echo_success "Repositorio clonado"
fi

# 7. Instalar dependencias de Node.js
echo "📦 Instalando dependencias de Node.js..."
npm ci --production=false
echo_success "Dependencias instaladas"

# 8. Configurar variables de entorno
echo "⚙️  Configurando variables de entorno..."
if [ ! -f ".env" ]; then
    echo_warning "Archivo .env no encontrado. Creando plantilla..."
    cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/cotizador_mad?schema=public"

# NextAuth
NEXTAUTH_URL="http://tu-dominio.com"
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"

# App
NODE_ENV="production"
PORT=3000
EOF
    echo_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
    echo "Presiona Enter cuando hayas editado el archivo .env..."
    read
fi
echo_success "Variables de entorno configuradas"

# 9. Configurar base de datos PostgreSQL
echo "🗄️  Configurando base de datos..."
echo_warning "Asegúrate de haber creado la base de datos PostgreSQL"
echo "Ejecuta estos comandos manualmente si aún no lo has hecho:"
echo "  sudo -u postgres psql"
echo "  CREATE DATABASE cotizador_mad;"
echo "  CREATE USER tu_usuario WITH PASSWORD 'tu_password';"
echo "  GRANT ALL PRIVILEGES ON DATABASE cotizador_mad TO tu_usuario;"
echo "  \\q"
echo ""
read -p "¿Ya configuraste la base de datos? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo_error "Por favor configura la base de datos primero"
    exit 1
fi

# 10. Ejecutar migraciones de Prisma
echo "🔄 Ejecutando migraciones de base de datos..."
npx prisma generate
npx prisma migrate deploy
echo_success "Migraciones ejecutadas"

# 11. Opcional: Ejecutar seed
read -p "¿Deseas ejecutar el seed de datos iniciales? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Ejecutando seed..."
    npm run seed || echo_warning "Seed falló, pero continuando..."
fi

# 12. Construir la aplicación Next.js
echo "🏗️  Construyendo aplicación Next.js..."
npm run build
echo_success "Aplicación construida"

# 13. Configurar PM2
echo "⚙️  Configurando PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cotizador-mad',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/cotizador-mad',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF
echo_success "PM2 configurado"

# 14. Iniciar aplicación con PM2
echo "🚀 Iniciando aplicación..."
pm2 delete $PM2_APP_NAME 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root
echo_success "Aplicación iniciada"

# 15. Configurar Nginx como reverse proxy
echo "🌐 Configurando Nginx..."
cat > /etc/nginx/sites-available/$APP_NAME << 'EOF'
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
EOF

# Habilitar sitio
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Verificar configuración de Nginx
nginx -t

# Reiniciar Nginx
systemctl restart nginx
systemctl enable nginx
echo_success "Nginx configurado"

# 16. Configurar firewall (UFW)
echo "🔒 Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo_success "Firewall configurado"

# 17. Mostrar estado
echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ ¡Despliegue completado exitosamente!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Estado de la aplicación:"
pm2 status
echo ""
echo "🌐 Tu aplicación debería estar disponible en:"
echo "   http://tu-dominio.com"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:        pm2 logs $PM2_APP_NAME"
echo "   Reiniciar app:   pm2 restart $PM2_APP_NAME"
echo "   Detener app:     pm2 stop $PM2_APP_NAME"
echo "   Estado PM2:      pm2 status"
echo ""
echo "🔐 Próximos pasos recomendados:"
echo "   1. Configura SSL con Let's Encrypt (certbot)"
echo "   2. Configura backups automáticos de la base de datos"
echo "   3. Actualiza el dominio en /etc/nginx/sites-available/$APP_NAME"
echo "   4. Actualiza NEXTAUTH_URL en el archivo .env"
echo ""
echo "════════════════════════════════════════════════════════════"
