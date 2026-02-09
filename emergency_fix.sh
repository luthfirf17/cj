#!/bin/bash

# Emergency fix for backend Docker image on VPS
# Run this directly on VPS terminal

echo "=== EMERGENCY BACKEND FIX ==="
echo "Fixing express-session module issue"

cd ~/cj

# Stop all containers first
echo "Stopping all containers..."
docker-compose -f docker/docker-compose.prod.yml down

# Remove old image
echo "Removing old backend image..."
docker rmi docker_backend 2>/dev/null || echo "Image not found, continuing..."

# Build new image from source
echo "Building fresh backend image..."
docker build -t docker_backend ./backend

# Verify dependencies
echo "Verifying dependencies..."
docker run --rm docker_backend npm list express-session --depth=0

if [ $? -eq 0 ]; then
    echo "✅ Dependencies verified!"
else
    echo "❌ Dependencies missing, trying npm install..."
    docker run --rm -v $(pwd)/backend:/app -w /app node:22-alpine sh -c "npm install"
    docker build -t docker_backend ./backend
fi

# Start services
echo "Starting production services..."
cd docker
docker-compose -f docker-compose.prod.yml up -d

# Wait and check
echo "Waiting 10 seconds for startup..."
sleep 10

echo "Checking container status..."
docker ps | grep backend

echo "Checking backend logs..."
docker logs catatjasamu-backend-prod --tail=10

echo "=== FIX COMPLETE ==="
echo "If backend is running, test with: curl http://localhost:5001/health"