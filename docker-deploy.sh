#!/bin/bash

# ============================================
# Script de Despliegue con Docker
# Cotizador MAD
# ============================================

set -e  # Detener en caso de error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
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

echo_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

echo ""
echo "🐳 ============================================"
echo "   Despliegue de Cotizador MAD con Docker"
echo "============================================"
echo ""

# ============================================
# 1. Verificar Docker y Docker Compose
# ============================================
echo_info "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo_error "Docker no está instalado"
    echo "Instala Docker desde: https://docs.docker.com/get-docker/"
    exit 1
fi
echo_success "Docker instalado"

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo_error "Docker Compose no está instalado"
    echo "Instala Docker Compose desde: https://docs.docker.com/compose/install/"
    exit 1
fi
echo_success "Docker Compose instalado"

# ============================================
# 2. Verificar archivo .env
# ============================================
echo_info "Verificando variables de entorno..."
if [ ! -f ".env" ]; then
    echo_warning "Archivo .env no encontrado"
    if [ -f ".env.docker" ]; then
        echo_info "Copiando .env.docker a .env..."
        cp .env.docker .env
        echo_warning "⚠️  IMPORTANTE: Edita el archivo .env con tus credenciales reales"
        echo ""
        echo "Debes configurar:"
        echo "  - POSTGRES_PASSWORD (contraseña segura)"
        echo "  - NEXTAUTH_SECRET (genera con: openssl rand -base64 32)"
        echo "  - NEXTAUTH_URL (tu dominio en producción)"
        echo ""
        read -p "Presiona Enter cuando hayas editado el archivo .env..."
    else
        echo_error "No se encontró .env.docker"
        exit 1
    fi
fi
echo_success "Archivo .env configurado"

# ============================================
# 3. Crear directorios necesarios
# ============================================
echo_info "Creando directorios necesarios..."
mkdir -p backups
mkdir -p nginx
mkdir -p public/uploads
echo_success "Directorios creados"

# ============================================
# 4. Detener contenedores existentes (si existen)
# ============================================
echo_info "Deteniendo contenedores existentes..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true
echo_success "Contenedores detenidos"

# ============================================
# 5. Construir imágenes
# ============================================
echo_info "Construyendo imágenes Docker..."
echo "Esto puede tomar varios minutos..."
docker-compose build --no-cache || docker compose build --no-cache
echo_success "Imágenes construidas"

# ============================================
# 6. Iniciar servicios
# ============================================
echo_info "Iniciando servicios..."
docker-compose up -d postgres || docker compose up -d postgres
echo_success "PostgreSQL iniciado"

echo_info "Esperando a que PostgreSQL esté listo..."
sleep 10

echo_info "Iniciando aplicación..."
docker-compose up -d app || docker compose up -d app
echo_success "Aplicación iniciada"

# ============================================
# 7. Ejecutar migraciones (ya se hace en el comando del contenedor)
# ============================================
echo_info "Las migraciones se ejecutarán automáticamente..."
sleep 5

# ============================================
# 8. Opcional: Ejecutar seed
# ============================================
read -p "¿Deseas ejecutar el seed de datos iniciales? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo_info "Ejecutando seed..."
    docker-compose exec app npm run seed || docker compose exec app npm run seed || echo_warning "Seed falló, pero continuando..."
fi

# ============================================
# 9. Mostrar estado
# ============================================
echo ""
echo "════════════════════════════════════════════════════════════"
echo_success "¡Despliegue completado exitosamente!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Estado de los contenedores:"
docker-compose ps || docker compose ps
echo ""
echo "🌐 Tu aplicación está disponible en:"
echo "   http://localhost:3000"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs:              docker-compose logs -f app"
echo "   Ver logs de BD:        docker-compose logs -f postgres"
echo "   Reiniciar app:         docker-compose restart app"
echo "   Detener todo:          docker-compose down"
echo "   Backup de BD:          docker-compose exec postgres pg_dump -U cotizador cotizador_mad > backups/backup-\$(date +%Y%m%d-%H%M%S).sql"
echo ""
echo "🔐 Próximos pasos:"
echo "   1. Configura tu dominio en NEXTAUTH_URL (.env)"
echo "   2. Configura SSL con Let's Encrypt (si usas Nginx)"
echo "   3. Configura backups automáticos de la base de datos"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
