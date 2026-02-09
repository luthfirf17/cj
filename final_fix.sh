#!/bin/bash

# FINAL FIX: Sync files and rebuild backend
# Run this on VPS after transferring correct package.json

echo "=== FINAL BACKEND FIX ==="
echo "Starting at: $(date)"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Verify package.json is correct...${NC}"
grep "express-session" backend/package.json && echo -e "${GREEN}✅ express-session found in package.json${NC}" || echo -e "${RED}❌ express-session missing${NC}"

echo -e "${YELLOW}Step 2: Clean up everything...${NC}"
docker-compose -f docker/docker-compose.prod.yml down -v 2>/dev/null || true
docker rmi docker_backend 2>/dev/null || true

echo -e "${YELLOW}Step 3: Fresh npm install...${NC}"
cd backend
rm -rf node_modules package-lock.json
npm install

echo "Verifying local installation:"
npm list express-session --depth=0
cd ..

echo -e "${YELLOW}Step 4: Build fresh image...${NC}"
docker build --no-cache -t docker_backend ./backend

echo -e "${YELLOW}Step 5: Verify image has dependencies...${NC}"
docker run --rm docker_backend npm list express-session --depth=0

echo -e "${YELLOW}Step 6: Test module loading...${NC}"
docker run --rm docker_backend node -e "try { require('express-session'); console.log('✅ express-session loads successfully'); } catch(e) { console.log('❌ Error:', e.message); }"

echo -e "${YELLOW}Step 7: Start production services...${NC}"
cd docker
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 8: Monitor startup...${NC}"
sleep 15

echo "Container status:"
docker ps | grep backend

echo "Backend logs:"
timeout 10 docker logs -f catatjasamu-backend-prod 2>&1 | head -20

echo -e "${GREEN}=== FINAL FIX COMPLETE ===${NC}"
echo "Test API: curl http://localhost:5001/health"