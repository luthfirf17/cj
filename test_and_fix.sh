#!/bin/bash

# TEST API ENDPOINTS AND FIX FRONTEND
# Run this to verify backend API and fix frontend issues

echo "=== API TESTING & FRONTEND FIX ==="
echo "Starting at: $(date)"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== BACKEND API TESTING ===${NC}"

# Test different API endpoints
echo -e "${YELLOW}Testing backend health endpoints...${NC}"

# Test direct container access
echo "1. Testing direct container access:"
docker exec catatjasamu-backend-prod curl -s http://localhost:5001/health && echo -e "${GREEN}✅ Direct container access OK${NC}" || echo -e "${RED}❌ Direct container access failed${NC}"

# Test via docker network
echo "2. Testing via docker network:"
docker run --rm --network docker_catatjasamu-network-prod curlimages/curl -s http://catatjasamu-backend-prod:5001/health && echo -e "${GREEN}✅ Docker network access OK${NC}" || echo -e "${RED}❌ Docker network access failed${NC}"

# Test host access
echo "3. Testing host access (localhost:5001):"
curl -s http://localhost:5001/health && echo -e "${GREEN}✅ Host access OK${NC}" || echo -e "${RED}❌ Host access failed${NC}"

# Test specific API endpoints
echo "4. Testing API endpoints:"
curl -s http://localhost:5001/api/auth/status && echo -e "${GREEN}✅ Auth API OK${NC}" || echo -e "${RED}❌ Auth API failed${NC}"

echo -e "${BLUE}=== FRONTEND FIX ===${NC}"

# Check frontend container status
echo -e "${YELLOW}Checking frontend container...${NC}"
docker ps | grep frontend

# Check frontend logs
echo -e "${YELLOW}Frontend logs:${NC}"
docker logs catatjasamu-frontend-prod --tail=20

# If frontend is restarting, rebuild it
if docker ps | grep -q "frontend.*Restarting"; then
    echo -e "${RED}Frontend container is restarting, rebuilding...${NC}"

    # Stop and remove failing container
    docker stop catatjasamu-frontend-prod 2>/dev/null || true
    docker rm catatjasamu-frontend-prod 2>/dev/null || true

    # Remove old image
    docker rmi docker_frontend 2>/dev/null || true

    # Rebuild frontend
    cd frontend
    docker build --no-cache -t docker_frontend .
    cd ..

    # Restart services
    cd docker
    docker-compose -f docker-compose.prod.yml up -d frontend
    cd ..

    echo -e "${YELLOW}Waiting for frontend rebuild...${NC}"
    sleep 30

    # Check new status
    docker ps | grep frontend
    docker logs catatjasamu-frontend-prod --tail=10
fi

echo -e "${BLUE}=== FINAL STATUS CHECK ===${NC}"

echo "Container status:"
docker ps

echo -e "${YELLOW}Testing main application:${NC}"
curl -s -I https://catatjasamu.com | head -1

echo -e "${YELLOW}Testing API domain:${NC}"
curl -s -I https://api.catatjasamu.com | head -1

echo -e "${GREEN}=== TESTING COMPLETE ===${NC}"
echo ""
echo "🎉 If all tests pass, your application is fully operational!"
echo ""
echo "📱 Frontend: https://catatjasamu.com"
echo "🔧 API: https://api.catatjasamu.com"
echo "🧪 API Direct: http://YOUR_SERVER_IP:5001"