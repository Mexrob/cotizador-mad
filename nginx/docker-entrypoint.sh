#!/bin/sh
set -e

echo "Esperando a que app:3000 esté disponible..."
counter=0
until wget --spider -q http://app:3000 || [ $counter -eq 30 ]; do
    echo "Esperando... ($counter)"
    sleep 2
    counter=$((counter + 1))
done

if [ $counter -eq 30 ]; then
    echo "ADVERTENCIA: No se pudo conectar a app, iniciando de todos modos..."
fi

echo "app:3000 está disponible, iniciando nginx..."

exec /docker-entrypoint.sh "$@"
