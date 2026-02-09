#!/bin/bash

# VPS Backend Fix Script - Run on VPS
# This script will fix the express-session module issue

set -e  # Exit on any error

echo "=== VPS BACKEND FIX SCRIPT ==="
echo "Starting at: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd ~/cj

echo -e "${YELLOW}Step 1: Stopping all containers...${NC}"
docker-compose -f docker/docker-compose.prod.yml down || true

echo -e "${YELLOW}Step 2: Removing old backend image...${NC}"
docker rmi docker_backend 2>/dev/null || echo "Old image not found"

echo -e "${YELLOW}Step 3: Building fresh backend image...${NC}"
if docker build -t docker_backend ./backend; then
    echo -e "${GREEN}✅ Image build successful${NC}"
else
    echo -e "${RED}❌ Image build failed${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 4: Verifying dependencies...${NC}"
if docker run --rm docker_backend npm list express-session --depth=0 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ express-session dependency verified${NC}"
else
    echo -e "${RED}❌ express-session dependency missing${NC}"
    echo -e "${YELLOW}Attempting to reinstall dependencies...${NC}"
    docker run --rm -v $(pwd)/backend:/app -w /app node:22-alpine npm install
    docker build -t docker_backend ./backend
fi

echo -e "${YELLOW}Step 5: Starting production services...${NC}"
cd docker
if docker-compose -f docker-compose.prod.yml up -d; then
    echo -e "${GREEN}✅ Services started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 6: Waiting for services to be ready...${NC}"
sleep 15

echo -e "${YELLOW}Step 7: Checking container status...${NC}"
if docker ps | grep -q backend; then
    echo -e "${GREEN}✅ Backend container is running${NC}"
else
    echo -e "${RED}❌ Backend container not found${NC}"
fi

echo -e "${YELLOW}Step 8: Checking backend logs...${NC}"
docker logs catatjasamu-backend-prod --tail=10

echo -e "${YELLOW}Step 9: Testing internal API...${NC}"
if curl -s http://localhost:5001/health >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Internal API responding${NC}"
else
    echo -e "${RED}❌ Internal API not responding${NC}"
fi

echo -e "${GREEN}=== FIX COMPLETE ===${NC}"
echo "Check your application at: https://catatjasamu.com"
echo "API endpoint: https://api.catatjasamu.com"
echo ""
echo "If issues persist, check logs with:"
echo "docker logs catatjasamu-backend-prod --tail=50"