#!/bin/bash

# Configuration
VPS_IP="84.247.129.26"
VPS_USER="roberto"
VPS_PORT="5522"
SSH_KEY="./deploy_key"
REMOTE_DIR="/home/roberto/cotizador-mad"

echo "=== Packaging Application ==="
mkdir -p deploy_temp

# Create production .env
cat > deploy_temp/.env <<EOF
DATABASE_URL=postgresql://cotizador:changeme123@postgres:5432/cotizador_mad?schema=public
NEXTAUTH_URL=http://84.247.129.26
NEXTAUTH_SECRET=deployment_temp_secret_key_12345
NODE_ENV=production
POSTGRES_USER=cotizador
POSTGRES_PASSWORD=changeme123
POSTGRES_DB=cotizador_mad
EOF

# Copy files
cp -r app components lib prisma public scripts hooks maracs middleware.ts next.config.js package.json package-lock.json tsconfig.json postcss.config.js tailwind.config.ts docker-compose.yml Dockerfile nginx deploy_temp/ 2>/dev/null || true
# Note: ignoring errors for missing optional dirs like hooks/marcas if they don't exist, but copying what we can. 
# Better: list specific dirs.
cp -r hooks deploy_temp/ 2>/dev/null
cp -r marcas deploy_temp/ 2>/dev/null
cp -r nginx deploy_temp/ 2>/dev/null
cp -r components.json deploy_temp/ 2>/dev/null
cp -r next-env.d.ts deploy_temp/ 2>/dev/null
cp -r .dockerignore deploy_temp/ 2>/dev/null

# Tar it up
tar -czf deploy.tar.gz -C deploy_temp .
rm -rf deploy_temp

echo "=== Transferring to VPS ==="
scp -P $VPS_PORT -i $SSH_KEY -o StrictHostKeyChecking=no deploy.tar.gz $VPS_USER@$VPS_IP:~

echo "=== Deploying on VPS ==="
ssh -p $VPS_PORT -i $SSH_KEY -o StrictHostKeyChecking=no $VPS_USER@$VPS_IP <<EOF
    mkdir -p $REMOTE_DIR
    tar -xzf deploy.tar.gz -C $REMOTE_DIR
    rm deploy.tar.gz
    
    cd $REMOTE_DIR
    
    echo "Stopping existing containers..."
    docker compose down || true
    
    echo "Starting new containers..."
    docker compose up -d --build
    
    echo "Checking status..."
    sleep 5
    docker compose ps
EOF

echo "=== Done ==="
rm deploy.tar.gz
