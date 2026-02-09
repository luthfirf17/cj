#!/bin/bash

# REBUILD BACKEND WITH COMPLETE SOURCE CODE
# Run this after transferring missing route files

echo "=== REBUILD BACKEND WITH COMPLETE CODE ==="
echo "Starting at: $(date)"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Verify all route files exist...${NC}"
ls -la backend/src/routes/user/userRoutes.js && echo -e "${GREEN}✅ userRoutes.js found${NC}" || echo -e "${RED}❌ userRoutes.js missing${NC}"
ls -la backend/src/routes/admin/adminRoutes.js && echo -e "${GREEN}✅ adminRoutes.js found${NC}" || echo -e "${RED}❌ adminRoutes.js missing${NC}"

echo -e "${YELLOW}Step 2: Clean up containers...${NC}"
docker-compose -f docker/docker-compose.prod.yml down

echo -e "${YELLOW}Step 3: Remove old image...${NC}"
docker rmi docker_backend 2>/dev/null || true

echo -e "${YELLOW}Step 4: Build fresh image with complete code...${NC}"
docker build --no-cache -t docker_backend ./backend

echo -e "${YELLOW}Step 5: Test module loading in container...${NC}"
docker run --rm docker_backend node -e "
try {
  require('express-session');
  console.log('✅ express-session OK');
} catch(e) {
  console.log('❌ express-session Error:', e.message);
}

try {
  require('./routes/user/userRoutes');
  console.log('✅ userRoutes OK');
} catch(e) {
  console.log('❌ userRoutes Error:', e.message);
}

try {
  require('./routes/admin/adminRoutes');
  console.log('✅ adminRoutes OK');
} catch(e) {
  console.log('❌ adminRoutes Error:', e.message);
}
"

echo -e "${YELLOW}Step 6: Start production services...${NC}"
cd docker
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 7: Monitor startup...${NC}"
sleep 20

echo "Container status:"
docker ps | grep backend

echo "Backend logs (last 30 lines):"
docker logs catatjasamu-backend-prod --tail=30

echo -e "${GREEN}=== REBUILD COMPLETE ===${NC}"
echo "Test API: curl http://localhost:5001/health"