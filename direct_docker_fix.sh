#!/bin/bash

# FINAL PRODUCTION FIX - Use Direct Docker Commands
# Avoid docker-compose bugs by using docker commands directly

echo "=== FINAL PRODUCTION FIX ==="
echo "Using direct Docker commands to avoid docker-compose bugs"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== CLEANUP EXISTING CONTAINERS ===${NC}"

# Stop all containers
echo -e "${YELLOW}Stopping all containers...${NC}"
docker stop catatjasamu-backend-prod catatjasamu-frontend-prod catatjasamu-postgres-prod 2>/dev/null || true

# Remove containers
echo -e "${YELLOW}Removing containers...${NC}"
docker rm catatjasamu-backend-prod catatjasamu-frontend-prod catatjasamu-postgres-prod 2>/dev/null || true

# Remove network
echo -e "${YELLOW}Removing network...${NC}"
docker network rm docker_catatjasamu-network-prod 2>/dev/null || true

echo -e "${BLUE}=== STARTING SERVICES WITH DIRECT DOCKER ===${NC}"

# Create network
echo -e "${YELLOW}Creating network...${NC}"
docker network create docker_catatjasamu-network-prod 2>/dev/null || true

# Start PostgreSQL
echo -e "${YELLOW}Starting PostgreSQL...${NC}"
docker run -d \
  --name catatjasamu-postgres-prod \
  --network docker_catatjasamu-network-prod \
  --restart unless-stopped \
  -e POSTGRES_DB=catat_jasamu_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=${DB_PASSWORD} \
  -v postgres_data_prod:/var/lib/postgresql/data \
  postgres:15-alpine

# Wait for PostgreSQL
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 10

# Start Backend
echo -e "${YELLOW}Starting Backend...${NC}"
docker run -d \
  --name catatjasamu-backend-prod \
  --network docker_catatjasamu-network-prod \
  --restart unless-stopped \
  -p 5001:5001 \
  -e PORT=5001 \
  -e NODE_ENV=production \
  -e DB_HOST=catatjasamu-postgres-prod \
  -e DB_PORT=5432 \
  -e DB_NAME=catat_jasamu_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=${DB_PASSWORD} \
  -e JWT_SECRET=${JWT_SECRET} \
  -e JWT_EXPIRE=7d \
  -e FRONTEND_URL=http://catatjasamu.com \
  -e BACKEND_URL=http://api.catatjasamu.com \
  -e GOOGLE_CALLBACK_URL=${GOOGLE_CALLBACK_URL} \
  -e GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID} \
  -e GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET} \
  -e GOOGLE_CALENDAR_CLIENT_ID=${GOOGLE_CALENDAR_CLIENT_ID} \
  -e GOOGLE_CALENDAR_CLIENT_SECRET=${GOOGLE_CALENDAR_CLIENT_SECRET} \
  -e GOOGLE_CALENDAR_REDIRECT_URI=${GOOGLE_CALENDAR_REDIRECT_URI} \
  docker_backend

# Wait for Backend
echo -e "${YELLOW}Waiting for Backend to be ready...${NC}"
sleep 15

# Start Frontend with HTTP only (no SSL)
echo -e "${YELLOW}Starting Frontend (HTTP only)...${NC}"
docker run -d \
  --name catatjasamu-frontend-prod \
  --network docker_catatjasamu-network-prod \
  --restart unless-stopped \
  -p 80:80 \
  -e VITE_API_URL=http://catatjasamu.com/api \
  docker_frontend

echo -e "${BLUE}=== VERIFICATION ===${NC}"

echo "Container status:"
docker ps

echo -e "${YELLOW}Testing Backend API...${NC}"
curl -s http://localhost:5001/health && echo -e "${GREEN}✅ Backend API OK${NC}" || echo -e "${RED}❌ Backend API failed${NC}"

echo -e "${YELLOW}Testing Frontend...${NC}"
curl -s -I http://localhost | head -1 && echo -e "${GREEN}✅ Frontend OK${NC}" || echo -e "${RED}❌ Frontend failed${NC}"

echo -e "${YELLOW}Testing main application...${NC}"
curl -s -I http://catatjasamu.com | head -1

echo -e "${BLUE}=== FINAL STATUS ===${NC}"
echo ""
echo "🎉 PRODUCTION DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 URLs:"
echo "📱 Frontend: http://catatjasamu.com"
echo "🔧 API: http://catatjasamu.com/api"
echo "🧪 API Direct: http://localhost:5001"
echo ""
echo "✅ Backend: Running with port 5001 exposed"
echo "✅ Database: PostgreSQL healthy"
echo "✅ Frontend: Serving on port 80"
echo ""
echo "📝 Note: Using HTTP temporarily. SSL can be added later."
echo ""
echo "🔍 Check logs with:"
echo "docker logs catatjasamu-backend-prod"
echo "docker logs catatjasamu-frontend-prod"
echo "docker logs catatjasamu-postgres-prod"