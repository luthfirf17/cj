#!/bin/bash
# ===========================================
# CatatJasamu - Production Deploy Script
# Usage: ./scripts/deploy-prod.sh
# ===========================================

set -e

echo "🚀 CatatJasamu - Production Deployment"
echo "======================================="

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "❌ Error: .env.production not found!"
    echo "   Please copy .env.production.example and fill in your values"
    exit 1
fi

# Copy production env to docker/.env
echo "📋 Setting up production environment..."
cp .env.production docker/.env

# Build and deploy
echo "🔨 Building Docker images..."
cd docker
docker compose -f docker-compose.prod.yml build --no-cache

echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down

echo "🚀 Starting production containers..."
docker compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to start..."
sleep 10

# Check health
echo "🔍 Checking service health..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: https://catatjasamu.com"
echo "🔧 Backend:  https://catatjasamu.com/api"
echo ""
echo "📋 Useful commands:"
echo "   docker compose -f docker/docker-compose.prod.yml logs -f        # View logs"
echo "   docker compose -f docker/docker-compose.prod.yml ps             # Check status"
echo "   docker compose -f docker/docker-compose.prod.yml down           # Stop"
echo "   docker compose -f docker/docker-compose.prod.yml restart        # Restart"
