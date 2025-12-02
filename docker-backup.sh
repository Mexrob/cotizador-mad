#!/bin/bash

# ============================================
# Script de Backup Automático
# Cotizador MAD - PostgreSQL
# ============================================

set -e

# Configuración
BACKUP_DIR="./backups"
CONTAINER_NAME="cotizador-postgres"
DB_USER="cotizador"
DB_NAME="cotizador_mad"
RETENTION_DAYS=7  # Mantener backups de los últimos 7 días

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Crear directorio de backups si no existe
mkdir -p "$BACKUP_DIR"

# Nombre del archivo de backup con timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"

echo "🗄️  Iniciando backup de la base de datos..."

# Realizar backup
if docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE"; then
    echo_success "Backup creado: $BACKUP_FILE"
    
    # Comprimir backup
    gzip "$BACKUP_FILE"
    echo_success "Backup comprimido: $BACKUP_FILE.gz"
    
    # Eliminar backups antiguos
    echo "🧹 Limpiando backups antiguos (más de $RETENTION_DAYS días)..."
    find "$BACKUP_DIR" -name "backup-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
    echo_success "Limpieza completada"
    
    # Mostrar tamaño del backup
    SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
    echo_success "Tamaño del backup: $SIZE"
    
    # Listar backups existentes
    echo ""
    echo "📋 Backups disponibles:"
    ls -lh "$BACKUP_DIR"/backup-*.sql.gz 2>/dev/null || echo "No hay backups anteriores"
    
else
    echo_error "Error al crear el backup"
    exit 1
fi

echo ""
echo_success "¡Backup completado exitosamente!"
