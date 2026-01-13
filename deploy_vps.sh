#!/bin/bash

# Configuration
REMOTE_DIR=$(pwd)

echo "=== Deploying Locally on VPS ==="

echo "Verifying .env file..."
if [ ! -f ".env" ]; then
    echo "Error: .env file not found. Please create it first."
    exit 1
fi

echo "Stopping existing containers..."
docker compose down || true

echo "Starting new containers (this will rebuild images)..."
docker compose up -d --build

echo "Checking status..."
sleep 5
docker compose ps

echo "=== Done ==="
