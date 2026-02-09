#!/bin/bash

# Advanced VPS Backend Troubleshooting Script
# Run this on VPS to diagnose and fix dependency issues

set -e

echo "=== ADVANCED BACKEND TROUBLESHOOTING ==="
echo "Starting at: $(date)"

cd ~/cj

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Step 1: Complete cleanup...${NC}"
docker-compose -f docker/docker-compose.prod.yml down -v 2>/dev/null || true
docker system prune -f
docker rmi docker_backend 2>/dev/null || true

echo -e "${YELLOW}Step 2: Verify source files...${NC}"
ls -la backend/package*.json
cat backend/package.json | grep -A 5 '"dependencies"'
echo "express-session in package.json:"
grep "express-session" backend/package.json || echo "NOT FOUND!"

echo -e "${YELLOW}Step 3: Test npm install locally...${NC}"
cd backend
npm install
echo "Local npm list:"
npm list express-session --depth=0
cd ..

echo -e "${YELLOW}Step 4: Build with no cache...${NC}"
docker build --no-cache -t docker_backend ./backend

echo -e "${YELLOW}Step 5: Verify image contents...${NC}"
echo "Checking if node_modules exists in image:"
docker run --rm docker_backend ls -la node_modules/ | head -10

echo "Checking express-session in image:"
docker run --rm docker_backend ls -la node_modules/express-session 2>/dev/null && echo "✅ Found" || echo "❌ Missing"

echo "Testing npm list in container:"
docker run --rm docker_backend npm list express-session --depth=0

echo -e "${YELLOW}Step 6: Debug container startup...${NC}"
echo "Testing container startup with verbose logging:"
docker run --rm -e NODE_ENV=production docker_backend node -e "console.log('Node version:', process.version); try { require('express-session'); console.log('✅ express-session loaded'); } catch(e) { console.log('❌ express-session error:', e.message); }"

echo -e "${YELLOW}Step 7: Start services with debugging...${NC}"
cd docker
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Step 8: Monitor startup...${NC}"
sleep 10

echo "Container status:"
docker ps

echo "Backend logs:"
docker logs catatjasamu-backend-prod --tail=20

echo -e "${GREEN}=== TROUBLESHOOTING COMPLETE ===${NC}"
echo "If still failing, the issue might be:"
echo "1. Node version mismatch (Dockerfile vs runtime)"
echo "2. Volume mounting issues"
echo "3. Environment variables missing"