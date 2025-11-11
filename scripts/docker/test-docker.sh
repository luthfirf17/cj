#!/bin/bash

# Script untuk testing Docker setup Catat Jasamu
# Usage: ./scripts/docker/test-docker.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Change to docker directory
cd "$(dirname "$0")/../../docker"

print_header "TESTING DOCKER SETUP CATAT JASAMU"

# Test 1: Check if Docker is running
print_header "1. Checking Docker Status"
if docker info > /dev/null 2>&1; then
    print_success "Docker is running"
else
    print_error "Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Test 2: Check containers status
print_header "2. Checking Containers Status"
if docker-compose ps | grep -q "Up"; then
    print_success "Containers are running"
    docker-compose ps
else
    print_warning "Some containers are not running"
    docker-compose ps
fi

# Test 3: Test PostgreSQL connection
print_header "3. Testing PostgreSQL Database"
if docker exec catatjasamu-postgres pg_isready -U postgres > /dev/null 2>&1; then
    print_success "PostgreSQL is ready"
    
    # Check database exists
    if docker exec catatjasamu-postgres psql -U postgres -lqt | cut -d \| -f 1 | grep -qw catat_jasamu_db; then
        print_success "Database 'catat_jasamu_db' exists"
    else
        print_error "Database 'catat_jasamu_db' not found"
    fi
    
    # Check tables
    TABLE_COUNT=$(docker exec catatjasamu-postgres psql -U postgres -d catat_jasamu_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')
    if [ "$TABLE_COUNT" -ge 9 ]; then
        print_success "All 9 tables exist in database"
        echo -e "\nTables:"
        docker exec catatjasamu-postgres psql -U postgres -d catat_jasamu_db -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
    else
        print_error "Only $TABLE_COUNT tables found (expected 9)"
    fi
else
    print_error "PostgreSQL is not ready"
fi

# Test 4: Test Backend API
print_header "4. Testing Backend API"
if curl -s http://localhost:5001/health > /dev/null 2>&1; then
    print_success "Backend API is accessible"
    
    HEALTH_RESPONSE=$(curl -s http://localhost:5001/health)
    echo -e "\nHealth Check Response:"
    echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
    
    # Check if database is connected
    if echo "$HEALTH_RESPONSE" | grep -q '"database": "up"'; then
        print_success "Backend connected to database"
    else
        print_error "Backend not connected to database"
    fi
else
    print_error "Backend API is not accessible at http://localhost:5001"
fi

# Test 5: Test Frontend
print_header "5. Testing Frontend"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is accessible at http://localhost:3000"
    
    # Check if HTML contains expected elements
    if curl -s http://localhost:3000 | grep -q "Catat Jasamu"; then
        print_success "Frontend HTML contains 'Catat Jasamu'"
    else
        print_warning "Frontend HTML might not be loaded correctly"
    fi
else
    print_error "Frontend is not accessible at http://localhost:3000"
fi

# Test 6: Check Docker volumes
print_header "6. Checking Docker Volumes"
VOLUME_COUNT=$(docker volume ls | grep -c "postgres_data" || echo "0")
if [ "$VOLUME_COUNT" -gt 0 ]; then
    print_success "PostgreSQL data volume exists"
    docker volume ls | grep postgres_data
else
    print_error "PostgreSQL data volume not found"
fi

# Test 7: Check Docker networks
print_header "7. Checking Docker Networks"
if docker network ls | grep -q "catatjasamu-network"; then
    print_success "Docker network 'catatjasamu-network' exists"
else
    print_error "Docker network 'catatjasamu-network' not found"
fi

# Test 8: Check container logs for errors
print_header "8. Checking Container Logs for Recent Errors"
echo -e "\n${YELLOW}Backend Logs (last 10 lines):${NC}"
docker logs catatjasamu-backend --tail 10 2>&1

echo -e "\n${YELLOW}Frontend Logs (last 5 lines):${NC}"
docker logs catatjasamu-frontend --tail 5 2>&1

# Final Summary
print_header "TEST SUMMARY"

ALL_TESTS_PASSED=true

# Check each component
if docker-compose ps | grep -q "catatjasamu-postgres.*Up"; then
    print_success "PostgreSQL: Running"
else
    print_error "PostgreSQL: Not Running"
    ALL_TESTS_PASSED=false
fi

if docker-compose ps | grep -q "catatjasamu-backend.*Up"; then
    print_success "Backend: Running"
else
    print_error "Backend: Not Running"
    ALL_TESTS_PASSED=false
fi

if docker-compose ps | grep -q "catatjasamu-frontend.*Up"; then
    print_success "Frontend: Running"
else
    print_error "Frontend: Not Running"
    ALL_TESTS_PASSED=false
fi

echo -e "\n${BLUE}Quick Access URLs:${NC}"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5001"
echo "  Health:   http://localhost:5001/health"

if [ "$ALL_TESTS_PASSED" = true ]; then
    print_header "✓ ALL TESTS PASSED!"
    echo -e "${GREEN}Your Docker setup is working correctly!${NC}\n"
    exit 0
else
    print_header "✗ SOME TESTS FAILED"
    echo -e "${RED}Please check the errors above and fix them.${NC}\n"
    exit 1
fi
