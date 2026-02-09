#!/bin/bash

# Deploy script for Catat Jasamu to VPS
# Run this script on your VPS after updating code

set -e  # Exit on any error

echo "🚀 Starting deployment to VPS..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found!"
    echo "Please copy .env.production to .env and fill in your values"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker/docker-compose.prod.yml down || true

# Remove old images to free up space
echo "🧹 Cleaning up old Docker images..."
docker image prune -f || true

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose -f docker/docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run db:migrate

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker/docker-compose.prod.yml ps

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application should now be available at:"
echo "   Frontend: https://catatjasamu.com"
echo "   Backend API: https://api.catatjasamu.com"
echo ""
echo "📋 Next steps:"
echo "   1. Verify SSL certificates are properly configured"
echo "   2. Test Google OAuth and Calendar integration"
echo "   3. Test the booking link feature"
echo "   4. Check logs if anything fails: docker-compose -f docker/docker-compose.prod.yml logs"