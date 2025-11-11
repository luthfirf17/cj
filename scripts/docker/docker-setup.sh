#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🐳 Docker Setup - Catat Jasamu${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker tidak ditemukan!${NC}"
    echo "Silakan install Docker Desktop terlebih dahulu:"
    echo "https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose tidak ditemukan!${NC}"
    echo "Silakan install Docker Compose terlebih dahulu:"
    echo "https://docs.docker.com/compose/install/"
    exit 1
fi

echo -e "${GREEN}✅ Docker dan Docker Compose terdeteksi${NC}"
echo ""

# Ask for mode
echo "Pilih mode deployment:"
echo "1) Production (optimized, no hot-reload)"
echo "2) Development (with hot-reload)"
echo ""
read -p "Pilihan [1/2]: " mode

case $mode in
    1)
        echo ""
        echo -e "${CYAN}🚀 Starting Production Mode...${NC}"
        docker-compose down 2>/dev/null
        docker-compose build --no-cache
        docker-compose up -d
        COMPOSE_FILE="docker-compose.yml"
        ;;
    2)
        echo ""
        echo -e "${CYAN}🚀 Starting Development Mode...${NC}"
        docker-compose -f docker-compose.dev.yml down 2>/dev/null
        docker-compose -f docker-compose.dev.yml build --no-cache
        docker-compose -f docker-compose.dev.yml up -d
        COMPOSE_FILE="docker-compose.dev.yml"
        ;;
    *)
        echo -e "${RED}❌ Pilihan tidak valid${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}⏳ Menunggu services siap...${NC}"
sleep 5

# Check status
echo ""
if [ "$mode" = "1" ]; then
    docker-compose ps
else
    docker-compose -f docker-compose.dev.yml ps
fi

echo ""
echo -e "${GREEN}✅ Setup selesai!${NC}"
echo ""
echo -e "${CYAN}📍 Akses aplikasi:${NC}"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:5001"
echo "   Database:  localhost:5432"
echo ""
echo -e "${CYAN}📝 Commands berguna:${NC}"
if [ "$mode" = "1" ]; then
    echo "   docker-compose logs -f           # Lihat logs"
    echo "   docker-compose restart           # Restart services"
    echo "   docker-compose down              # Stop services"
else
    echo "   docker-compose -f docker-compose.dev.yml logs -f    # Lihat logs"
    echo "   docker-compose -f docker-compose.dev.yml restart    # Restart"
    echo "   docker-compose -f docker-compose.dev.yml down       # Stop"
fi
echo ""
echo "   Atau gunakan Makefile:"
echo "   make help                        # Lihat semua commands"
echo "   make logs                        # Lihat logs"
echo "   make ps                          # Lihat status"
echo ""
