#!/bin/bash

# Script to rebuild backend Docker image on VPS
# Run this on your VPS server

echo "=== Rebuilding backend Docker image on VPS ==="

cd ~/cj

# Stop and remove existing containers
echo "Stopping existing containers..."
docker stop catatjasamu-backend-prod 2>/dev/null || true
docker rm catatjasamu-backend-prod 2>/dev/null || true

# Remove old image
echo "Removing old backend image..."
docker rmi docker_backend 2>/dev/null || true

# Build new image
echo "Building new backend image..."
docker build -t docker_backend ./backend

# Test the image
echo "Testing the new image..."
cd docker
docker run --rm --name test-backend --env-file .env --network docker_catatjasamu-network-prod --link catatjasamu-postgres-prod:postgres docker_backend npm list express-session

if [ $? -eq 0 ]; then
    echo "✅ Image test successful!"
    echo "Starting production container..."
    docker-compose -f docker-compose.prod.yml up -d backend
    echo "✅ Backend container started!"
else
    echo "❌ Image test failed!"
    exit 1
fi