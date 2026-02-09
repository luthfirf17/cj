#!/bin/bash

# PRODUCTION FIX V2 - Fix port conflicts and database issues

echo "=== PRODUCTION FIX V2 ==="
echo "Fixing port conflicts and database connectivity"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== CHECKING PORT USAGE ===${NC}"

echo -e "${YELLOW}Checking port 80 usage:${NC}"
PORT_80=$(netstat -tlnp 2>/dev/null | grep :80 || echo "No process found")
if [ -n "$PORT_80" ]; then
    echo -e "${RED}❌ Port 80 in use:${NC}"
    echo "$PORT_80"
else
    echo -e "${GREEN}✅ Port 80 free${NC}"
fi

echo -e "${YELLOW}Checking port 81 usage:${NC}"
PORT_81=$(netstat -tlnp 2>/dev/null | grep :81 || echo "No process found")
if [ -n "$PORT_81" ]; then
    echo -e "${RED}❌ Port 81 in use:${NC}"
    echo "$PORT_81"
else
    echo -e "${GREEN}✅ Port 81 free${NC}"
fi

echo -e "${BLUE}=== COMPLETE CLEANUP ===${NC}"

# Source environment variables
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

# Stop all our containers
echo -e "${YELLOW}Stopping all containers...${NC}"
docker stop catatjasamu-backend-prod catatjasamu-frontend-prod catatjasamu-postgres-prod 2>/dev/null || true

# Remove our containers
echo -e "${YELLOW}Removing containers...${NC}"
docker rm catatjasamu-backend-prod catatjasamu-frontend-prod catatjasamu-postgres-prod 2>/dev/null || true

# Clean up networks
echo -e "${YELLOW}Cleaning networks...${NC}"
docker network rm docker_catatjasamu-network-prod 2>/dev/null || true

echo -e "${BLUE}=== STARTING SERVICES WITH FIXES ===${NC}"

# Create network
echo -e "${YELLOW}Creating network...${NC}"
docker network create docker_catatjasamu-network-prod 2>/dev/null || true

# Start PostgreSQL with proper environment
echo -e "${YELLOW}Starting PostgreSQL with proper config...${NC}"
docker run -d \
  --name catatjasamu-postgres-prod \
  --network docker_catatjasamu-network-prod \
  --restart unless-stopped \
  -e POSTGRES_DB=catat_jasamu_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=$DB_PASSWORD \
  -v postgres_data_prod:/var/lib/postgresql/data \
  postgres:15-alpine

# Wait for PostgreSQL to be healthy
echo -e "${YELLOW}Waiting for PostgreSQL...${NC}"
for i in {1..30}; do
    if docker exec catatjasamu-postgres-prod pg_isready -U postgres -d catat_jasamu_db >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL ready${NC}"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

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
  -e DB_PASSWORD=$DB_PASSWORD \
  -e JWT_SECRET=$JWT_SECRET \
  -e JWT_EXPIRE=7d \
  -e FRONTEND_URL=http://catatjasamu.com \
  -e BACKEND_URL=http://api.catatjasamu.com \
  -e GOOGLE_CALLBACK_URL=$GOOGLE_CALLBACK_URL \
  -e GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID \
  -e GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET \
  -e GOOGLE_CALENDAR_CLIENT_ID=$GOOGLE_CALENDAR_CLIENT_ID \
  -e GOOGLE_CALENDAR_CLIENT_SECRET=$GOOGLE_CALENDAR_CLIENT_SECRET \
  -e GOOGLE_CALENDAR_REDIRECT_URI=$GOOGLE_CALENDAR_REDIRECT_URI \
  docker_backend

# Wait for Backend
echo -e "${YELLOW}Waiting for Backend...${NC}"
sleep 15

# Start Frontend on port 81 (avoiding conflict with port 80)
echo -e "${YELLOW}Starting Frontend on port 81...${NC}"
docker run -d \
  --name catatjasamu-frontend-prod \
  --network docker_catatjasamu-network-prod \
  --restart unless-stopped \
  -p 81:80 \
  -e VITE_API_URL=http://catatjasamu.com/api \
  docker_frontend

echo -e "${BLUE}=== VERIFICATION ===${NC}"

echo "Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "${YELLOW}Testing Backend API...${NC}"
BACKEND_TEST=$(curl -s http://localhost:5001/health)
if echo "$BACKEND_TEST" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Backend API OK${NC}"
    echo "   Response: $BACKEND_TEST"
else
    echo -e "${RED}❌ Backend API failed${NC}"
    echo "   Response: $BACKEND_TEST"
fi

echo -e "${YELLOW}Testing Frontend on port 81...${NC}"
FRONTEND_TEST=$(curl -s -I http://localhost:81 | head -1)
if echo "$FRONTEND_TEST" | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Frontend OK on port 81${NC}"
else
    echo -e "${RED}❌ Frontend failed on port 81${NC}"
    echo "   Response: $FRONTEND_TEST"
fi

echo -e "${YELLOW}Testing PostgreSQL connectivity...${NC}"
if docker exec catatjasamu-postgres-prod pg_isready -U postgres -d catat_jasamu_db >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL healthy${NC}"
else
    echo -e "${RED}❌ PostgreSQL not healthy${NC}"
fi

echo -e "${BLUE}=== FINAL STATUS ===${NC}"
echo ""
echo "🎉 PRODUCTION DEPLOYMENT FIXED!"
echo ""
echo "🌐 URLs (UPDATED):"
echo "📱 Frontend: http://catatjasamu.com:81"
echo "🔧 API: http://catatjasamu.com/api"
echo "🧪 API Direct: http://localhost:5001"
echo ""
echo "📝 PORT CHANGES:"
echo "   - Frontend: Port 81 (instead of 80, to avoid conflicts)"
echo "   - Backend: Port 5001 (unchanged)"
echo "   - Database: Internal only"
echo ""
echo "🔍 Check logs:"
echo "docker logs catatjasamu-backend-prod"
echo "docker logs catatjasamu-frontend-prod"
echo "docker logs catatjasamu-postgres-prod"
echo ""
echo "⚠️  REMINDER: Update nginx reverse proxy to forward to port 81 for frontend"