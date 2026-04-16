#!/bin/bash

# ============================================
# Script de Restauración Automatizado
# Cotizador MAD - Restaura desde respaldo
# ============================================

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración por defecto
BACKUP_DIR="./backups"
DOCKER_COMPOSE_FILE="docker-compose.yml"
RESTORE_CODE=true
RESTORE_DB=true
RESTORE_IMAGES=true

echo_usage() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  -b, --backup DIR     Directorio del respaldo (default: ./backups)"
    echo "  -n, --name NAME      Nombre del respaldo a restaurar"
    echo "  --no-code            No restaurar código"
    echo "  --no-db              No restaurar base de datos"
    echo "  --no-images          No restaurar imágenes"
    echo "  -h, --help           Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 -n respaldo_20260302_123045"
    echo "  $0 --backup /backups/externo -n respaldo_20260302_123045"
}

# Parsear argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -b|--backup)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -n|--name)
            BACKUP_NAME="$2"
            shift 2
            ;;
        --no-code)
            RESTORE_CODE=false
            shift
            ;;
        --no-db)
            RESTORE_DB=false
            shift
            ;;
        --no-images)
            RESTORE_IMAGES=false
            shift
            ;;
        -h|--help)
            echo_usage
            exit 0
            ;;
        *)
            echo "Opción desconocida: $1"
            echo_usage
            exit 1
            ;;
    esac
done

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Verificar que se proporcionó el nombre del respaldo
if [ -z "$BACKUP_NAME" ]; then
    echo_error "Debes especificar el nombre del respaldo"
    echo_usage
    exit 1
fi

BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

echo ""
echo "============================================"
echo "  Restauración de Cotizador MAD"
echo "============================================"
echo ""
echo_info "Directorio de respaldo: $BACKUP_PATH"
echo_info "Restaurar código: $RESTORE_CODE"
echo_info "Restaurar DB: $RESTORE_DB"
echo_info "Restaurar imágenes: $RESTORE_IMAGES"
echo ""

# Verificar que el respaldo existe
if [ ! -d "$BACKUP_PATH" ]; then
    echo_error "No se encontró el respaldo: $BACKUP_PATH"
    exit 1
fi

# Listar archivos disponibles
echo_info "Archivos en el respaldo:"
ls -lh "$BACKUP_PATH"
echo ""

# Confirmar restauración
read -p "¿Continuar con la restauración? (s/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo_info "Restauración cancelada"
    exit 0
fi

# ============================================
# Paso 1: Preparar el entorno
# ============================================
echo ""
echo_info "Paso 1: Preparando entorno..."

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo_error "Docker no está instalado"
    exit 1
fi

# Verificar Docker Compose
if ! command -v docker compose &> /dev/null; then
    echo_error "Docker Compose no está instalado"
    exit 1
fi

# Verificar que existe docker-compose.yml
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    echo_error "No se encontró $DOCKER_COMPOSE_FILE"
    echo_info "Copia el archivo docker-compose.yml al directorio actual"
    exit 1
fi

echo_success "Entorno verificado"

# ============================================
# Paso 2: Detener servicios existentes
# ============================================
echo ""
echo_info "Paso 2: Deteniendo servicios..."

docker compose down 2>/dev/null || true
echo_success "Servicios detenidos"

# ============================================
# Paso 3: Restaurar Código Fuente
# ============================================
if [ "$RESTORE_CODE" = true ]; then
    echo ""
    echo_info "Paso 3: Restaurando código fuente..."

    CODE_FILE=$(ls "$BACKUP_PATH"/codigo_*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$CODE_FILE" ]; then
        echo_warning "No se encontró archivo de código en el respaldo"
    else
        # Crear backup del código actual si existe
        if [ -d ".git" ]; then
            echo_info "Código en git, no es necesario respaldar"
        elif [ -d "package.json" ]; then
            echo_warning "Respaldando código actual..."
            mkdir -p .backup_restore
            find . -maxdepth 1 ! -name '.backup_restore' ! -name '.' -exec cp -r {} .backup_restore/ \; 2>/dev/null || true
        fi

        # Extraer código
        echo_info "Extrayendo: $CODE_FILE"
        tar -xzf "$CODE_FILE" -C /tmp/
        
        # Mover archivos relevantes
        if [ -d "/tmp/home/ubuntu/cotizador-mad" ]; then
            cp -r /tmp/home/ubuntu/cotizador-mad/* . 2>/dev/null || true
        fi
        
        echo_success "Código restaurado"
    fi
fi

# ============================================
# Paso 4: Restaurar Imágenes
# ============================================
if [ "$RESTORE_IMAGES" = true ]; then
    echo ""
    echo_info "Paso 4: Restaurando imágenes..."

    IMAGES_FILE=$(ls "$BACKUP_PATH"/imagenes_*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$IMAGES_FILE" ]; then
        echo_warning "No se encontró archivo de imágenes en el respaldo"
    else
        # Crear directorio si no existe
        mkdir -p public/uploads
        
        # Extraer imágenes
        echo_info "Extrayendo: $IMAGES_FILE"
        tar -xzf "$IMAGES_FILE" -C /tmp/
        
        if [ -d "/tmp/uploads" ]; then
            cp -r /tmp/uploads/* public/uploads/ 2>/dev/null || true
        fi
        
        echo_success "Imágenes restauradas"
    fi
fi

# ============================================
# Paso 5: Iniciar servicios base
# ============================================
echo ""
echo_info "Paso 5: Iniciando servicios base..."

# Iniciar solo PostgreSQL primero
docker compose up -d postgres
echo_info "Esperando a PostgreSQL..."
sleep 15

# Verificar que PostgreSQL esté listo
for i in {1..30}; do
    if docker exec cotizador-postgres pg_isready -U cotizador &> /dev/null; then
        echo_success "PostgreSQL está listo"
        break
    fi
    if [ $i -eq 30 ]; then
        echo_error "PostgreSQL no respondió a tiempo"
        exit 1
    fi
    sleep 2
done

# ============================================
# Paso 6: Restaurar Base de Datos
# ============================================
if [ "$RESTORE_DB" = true ]; then
    echo ""
    echo_info "Paso 6: Restaurando base de datos..."

    DB_FILE=$(ls "$BACKUP_PATH"/*.sql* 2>/dev/null | head -1)
    
    if [ -z "$DB_FILE" ]; then
        echo_warning "No se encontró archivo de base de datos en el respaldo"
    else
        # Descomprimir si es necesario
        if [[ "$DB_FILE" == *.gz ]]; then
            echo_info "Descomprimiendo base de datos..."
            gunzip -c "$DB_FILE" > /tmp/restore.sql
            DB_FILE="/tmp/restore.sql"
        fi

        # Crear la base de datos si no existe
        docker exec cotizador-postgres psql -U cotizador -c "CREATE DATABASE cotizador_mad;" 2>/dev/null || true
        
        # Restaurar
        echo_info "Restaurando base de datos..."
        docker exec -i cotizador-postgres psql -U cotizador cotizador_mad < "$DB_FILE"
        
        echo_success "Base de datos restaurada"
    fi
fi

# ============================================
# Paso 7: Instalar dependencias
# ============================================
echo ""
echo_info "Paso 7: Instalando dependencias..."

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    echo_warning "No se encontró package.json, saltando instalación de dependencias"
else
    # Verificar node_modules
    if [ ! -d "node_modules" ]; then
        npm install
        echo_success "Dependencias instaladas"
    else
        echo_success "Dependencias ya instaladas"
    fi

    # Generar Prisma client
    if [ -f "prisma/schema.prisma" ]; then
        npx prisma generate
        echo_success "Prisma client generado"
    fi
fi

# ============================================
# Paso 8: Iniciar aplicación
# ============================================
echo ""
echo_info "Paso 8: Iniciando aplicación..."

docker compose up -d
sleep 10

# Verificar estado
if docker compose ps | grep -q "Up"; then
    echo_success "Aplicación iniciada"
else
    echo_warning "Revisa el estado de los contenedores"
    docker compose ps
fi

# ============================================
# Resumen
# ============================================
echo ""
echo "============================================"
echo "  Restauración Completada"
echo "============================================"
echo ""
echo_info "Verificaciones posteriores:"
echo "  - Revisa los logs: docker compose logs app"
echo "  - Accede a la app: http://localhost:3000"
echo "  - Verifica la DB: docker exec -it cotizador-postgres psql -U cotizador cotizador_mad"
echo ""
echo_info "Si hay errores, revisa los logs:"
echo "  docker compose logs --tail=100"
echo ""
