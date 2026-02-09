#!/bin/bash

# FINAL COMPLETE REBUILD WITH ALL SOURCE FILES
# Run this after transferring all missing source files

echo "=== FINAL COMPLETE REBUILD ==="
echo "Starting at: $(date)"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Verify all critical files exist...${NC}"

# Check routes
ls -la backend/src/routes/user/userRoutes.js >/dev/null 2>&1 && echo -e "${GREEN}✅ userRoutes.js${NC}" || echo -e "${RED}❌ userRoutes.js missing${NC}"
ls -la backend/src/routes/admin/adminRoutes.js >/dev/null 2>&1 && echo -e "${GREEN}✅ adminRoutes.js${NC}" || echo -e "${RED}❌ adminRoutes.js missing${NC}"

# Check controllers
ls -la backend/src/controllers/googleCalendarController.js >/dev/null 2>&1 && echo -e "${GREEN}✅ googleCalendarController.js${NC}" || echo -e "${RED}❌ googleCalendarController.js missing${NC}"
ls -la backend/src/controllers/authController.js >/dev/null 2>&1 && echo -e "${GREEN}✅ authController.js${NC}" || echo -e "${RED}❌ authController.js missing${NC}"

# Check services
ls -la backend/src/services/googleCalendarService.js >/dev/null 2>&1 && echo -e "${GREEN}✅ googleCalendarService.js${NC}" || echo -e "${RED}❌ googleCalendarService.js missing${NC}"

# Check middlewares
ls -la backend/src/middlewares/authMiddleware.js >/dev/null 2>&1 && echo -e "${GREEN}✅ authMiddleware.js${NC}" || echo -e "${RED}❌ authMiddleware.js missing${NC}"

echo -e "${YELLOW}Step 2: Clean up everything...${NC}"
docker-compose -f docker/docker-compose.prod.yml down -v 2>/dev/null || true
docker system prune -f >/dev/null 2>&1 || true
docker rmi docker_backend 2>/dev/null || true

echo -e "${YELLOW}Step 3: Build fresh image with complete codebase...${NC}"
docker build --no-cache -t docker_backend ./backend

echo -e "${YELLOW}Step 4: Comprehensive module testing...${NC}"
docker run --rm -w /app docker_backend node -e "
console.log('Testing all critical modules...');

try {
  require('express-session');
  console.log('✅ express-session OK');
} catch(e) {
  console.log('❌ express-session Error:', e.message);
}

try {
  require('./src/routes/user/userRoutes');
  console.log('✅ userRoutes OK');
} catch(e) {
  console.log('❌ userRoutes Error:', e.message);
}

try {
  require('./src/routes/admin/adminRoutes');
  console.log('✅ adminRoutes OK');
} catch(e) {
  console.log('❌ adminRoutes Error:', e.message);
}

try {
  require('./src/controllers/googleCalendarController');
  console.log('✅ googleCalendarController OK');
} catch(e) {
  console.log('❌ googleCalendarController Error:', e.message);
}

try {
  require('./src/services/googleCalendarService');
  console.log('✅ googleCalendarService OK');
} catch(e) {
  console.log('❌ googleCalendarService Error:', e.message);
}

try {
  require('./src/middlewares/authMiddleware');
  console.log('✅ authMiddleware OK');
} catch(e) {
  console.log('❌ authMiddleware Error:', e.message);
}

console.log('Module testing complete!');
"

echo -e "${YELLOW}Step 5: Start production services...${NC}"
cd docker
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 6: Monitor startup (60 seconds)...${NC}"
sleep 30

echo "Container status after 30s:"
docker ps | grep backend

sleep 30

echo "Container status after 60s:"
docker ps | grep backend

echo -e "${YELLOW}Step 7: Final logs check...${NC}"
docker logs catatjasamu-backend-prod --tail=50

echo -e "${GREEN}=== FINAL REBUILD COMPLETE ===${NC}"
echo "If backend is running, test with:"
echo "curl http://localhost:5001/health"
echo "curl https://api.catatjasamu.com/health (if domain configured)"