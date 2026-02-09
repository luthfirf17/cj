#!/bin/bash

# COMPREHENSIVE PRODUCTION TEST
# Test all aspects of the deployed application

echo "=== COMPREHENSIVE PRODUCTION TEST ==="
echo "Testing all application components"

cd ~/cj

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== CONTAINER STATUS ===${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo -e "${BLUE}=== BACKEND TESTS ===${NC}"

echo -e "${YELLOW}1. Backend Health Check:${NC}"
RESPONSE=$(curl -s http://localhost:5001/health)
if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✅ Backend Health: OK${NC}"
    echo "   Response: $RESPONSE"
else
    echo -e "${RED}❌ Backend Health: FAILED${NC}"
    echo "   Response: $RESPONSE"
fi

echo -e "${YELLOW}2. Backend API Status:${NC}"
STATUS=$(curl -s http://localhost:5001/api/auth/status 2>/dev/null || echo "failed")
if [ "$STATUS" != "failed" ]; then
    echo -e "${GREEN}✅ Backend API: OK${NC}"
else
    echo -e "${RED}❌ Backend API: FAILED${NC}"
fi

echo -e "${BLUE}=== FRONTEND TESTS ===${NC}"

echo -e "${YELLOW}3. Frontend HTTP Response:${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend HTTP: OK (Status: $HTTP_STATUS)${NC}"
else
    echo -e "${RED}❌ Frontend HTTP: FAILED (Status: $HTTP_STATUS)${NC}"
fi

echo -e "${YELLOW}4. Frontend Content Check:${NC}"
CONTENT=$(curl -s http://localhost | head -20)
if echo "$CONTENT" | grep -q "Catat Jasamu"; then
    echo -e "${GREEN}✅ Frontend Content: OK (Contains app title)${NC}"
else
    echo -e "${RED}❌ Frontend Content: FAILED${NC}"
    echo "   First 20 lines:"
    echo "$CONTENT" | head -5
fi

echo -e "${BLUE}=== EXTERNAL ACCESS TESTS ===${NC}"

echo -e "${YELLOW}5. Domain Resolution:${NC}"
DOMAIN_IP=$(nslookup catatjasamu.com 2>/dev/null | grep -A1 "Name:" | tail -1 | awk '{print $2}' || echo "failed")
if [ "$DOMAIN_IP" != "failed" ] && [ -n "$DOMAIN_IP" ]; then
    echo -e "${GREEN}✅ Domain Resolution: OK ($DOMAIN_IP)${NC}"
else
    echo -e "${RED}❌ Domain Resolution: FAILED${NC}"
fi

echo -e "${YELLOW}6. External Frontend Access:${NC}"
EXT_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://catatjasamu.com 2>/dev/null || echo "failed")
if [ "$EXT_HTTP" = "200" ] || [ "$EXT_HTTP" = "301" ]; then
    echo -e "${GREEN}✅ External Frontend: OK (Status: $EXT_HTTP)${NC}"
else
    echo -e "${RED}❌ External Frontend: FAILED${NC}"
fi

echo -e "${BLUE}=== LOGS CHECK ===${NC}"

echo -e "${YELLOW}7. Backend Logs (last 5 lines):${NC}"
docker logs catatjasamu-backend-prod --tail=5 2>/dev/null || echo "No logs available"

echo -e "${YELLOW}8. Frontend Logs (last 5 lines):${NC}"
docker logs catatjasamu-frontend-prod --tail=5 2>/dev/null || echo "No logs available"

echo -e "${BLUE}=== FINAL SUMMARY ===${NC}"
echo ""
echo "🎯 DEPLOYMENT STATUS SUMMARY:"
echo ""

# Count successes and failures
SUCCESS_COUNT=0
TOTAL_TESTS=8

# Test results summary
echo "✅ PASSED TESTS:"
[ "$HTTP_STATUS" = "200" ] && echo "   - Frontend HTTP Response" && ((SUCCESS_COUNT++))
echo "$RESPONSE" | grep -q '"success":true' && echo "   - Backend Health Check" && ((SUCCESS_COUNT++))
[ "$EXT_HTTP" = "200" ] || [ "$EXT_HTTP" = "301" ] && echo "   - External Frontend Access" && ((SUCCESS_COUNT++))
[ "$DOMAIN_IP" != "failed" ] && [ -n "$DOMAIN_IP" ] && echo "   - Domain Resolution" && ((SUCCESS_COUNT++))
echo "$CONTENT" | grep -q "Catat Jasamu" && echo "   - Frontend Content" && ((SUCCESS_COUNT++))
[ "$STATUS" != "failed" ] && echo "   - Backend API Status" && ((SUCCESS_COUNT++))

echo ""
echo "📊 SUCCESS RATE: $SUCCESS_COUNT/$TOTAL_TESTS tests passed"

if [ $SUCCESS_COUNT -ge 6 ]; then
    echo -e "${GREEN}🎉 OVERALL STATUS: EXCELLENT - PRODUCTION READY!${NC}"
elif [ $SUCCESS_COUNT -ge 4 ]; then
    echo -e "${YELLOW}⚠️  OVERALL STATUS: GOOD - MINOR ISSUES${NC}"
else
    echo -e "${RED}❌ OVERALL STATUS: NEEDS ATTENTION${NC}"
fi

echo ""
echo "🌐 ACCESS URLs:"
echo "📱 Frontend: http://catatjasamu.com"
echo "🔧 API: http://catatjasamu.com/api"
echo "🧪 Direct API: http://localhost:5001"
echo ""
echo "🔍 For troubleshooting:"
echo "docker logs [container_name] --tail=20"