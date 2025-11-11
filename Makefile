.PHONY: help build up down restart logs ps clean rebuild migrate backup restore dev dev-logs prod

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Tampilkan bantuan command
	@echo "$(CYAN)🐳 Docker Commands - Catat Jasamu$(NC)"
	@echo ""
	@echo "$(GREEN)Production Commands:$(NC)"
	@echo "  make build          - Build semua Docker images"
	@echo "  make up             - Start aplikasi (production)"
	@echo "  make down           - Stop aplikasi"
	@echo "  make restart        - Restart semua services"
	@echo "  make logs           - Tampilkan logs semua services"
	@echo "  make ps             - Tampilkan status containers"
	@echo ""
	@echo "$(GREEN)Development Commands:$(NC)"
	@echo "  make dev            - Start aplikasi (development mode)"
	@echo "  make dev-logs       - Tampilkan logs (development)"
	@echo "  make dev-down       - Stop aplikasi (development)"
	@echo ""
	@echo "$(GREEN)Database Commands:$(NC)"
	@echo "  make migrate        - Jalankan database migrations"
	@echo "  make backup         - Backup database"
	@echo "  make restore        - Restore database dari backup"
	@echo "  make db-shell       - Akses PostgreSQL shell"
	@echo ""
	@echo "$(GREEN)Maintenance Commands:$(NC)"
	@echo "  make rebuild        - Rebuild dan restart semua"
	@echo "  make clean          - Hapus containers, images, dan volumes"
	@echo "  make backend-shell  - Akses backend container shell"
	@echo "  make frontend-shell - Akses frontend container shell"
	@echo "  make test           - Jalankan comprehensive Docker tests"
	@echo "  make health         - Quick health check"
	@echo ""

build: ## Build semua Docker images
	@echo "$(CYAN)🔨 Building Docker images...$(NC)"
	docker-compose build

up: ## Start aplikasi dalam production mode
	@echo "$(GREEN)🚀 Starting application (production)...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✅ Application started!$(NC)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend:  http://localhost:5001"

down: ## Stop aplikasi
	@echo "$(YELLOW)⏸️  Stopping application...$(NC)"
	docker-compose down
	@echo "$(GREEN)✅ Application stopped!$(NC)"

restart: ## Restart semua services
	@echo "$(CYAN)🔄 Restarting application...$(NC)"
	docker-compose restart
	@echo "$(GREEN)✅ Application restarted!$(NC)"

logs: ## Tampilkan logs semua services
	docker-compose logs -f

ps: ## Tampilkan status containers
	docker-compose ps

clean: ## Hapus containers, images, dan volumes (HATI-HATI)
	@echo "$(RED)⚠️  Warning: This will delete all containers, images, and volumes!$(NC)"
	@echo "Press Ctrl+C to cancel, or Enter to continue..."
	@read
	docker-compose down -v --rmi all
	@echo "$(GREEN)✅ Cleanup completed!$(NC)"

rebuild: ## Rebuild dan restart semua
	@echo "$(CYAN)🔨 Rebuilding application...$(NC)"
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✅ Rebuild completed!$(NC)"

# Development commands
dev: ## Start aplikasi dalam development mode
	@echo "$(GREEN)🚀 Starting application (development mode)...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Development mode started!$(NC)"
	@echo "Frontend: http://localhost:3000 (hot-reload enabled)"
	@echo "Backend:  http://localhost:5001 (nodemon enabled)"

dev-logs: ## Tampilkan logs (development)
	docker-compose -f docker-compose.dev.yml logs -f

dev-down: ## Stop aplikasi (development)
	@echo "$(YELLOW)⏸️  Stopping development mode...$(NC)"
	docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✅ Development mode stopped!$(NC)"

# Database commands
migrate: ## Jalankan database migrations
	@echo "$(CYAN)📊 Running database migrations...$(NC)"
	docker-compose exec backend npm run db:migrate
	@echo "$(GREEN)✅ Migrations completed!$(NC)"

backup: ## Backup database
	@echo "$(CYAN)💾 Creating database backup...$(NC)"
	docker-compose exec postgres pg_dump -U postgres catat_jasamu_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)✅ Backup created!$(NC)"

restore: ## Restore database dari backup (specify file with FILE=backup.sql)
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)❌ Error: Please specify backup file with FILE=backup.sql$(NC)"; \
		exit 1; \
	fi
	@echo "$(CYAN)📥 Restoring database from $(FILE)...$(NC)"
	docker-compose exec -T postgres psql -U postgres catat_jasamu_db < $(FILE)
	@echo "$(GREEN)✅ Database restored!$(NC)"

db-shell: ## Akses PostgreSQL shell
	@echo "$(CYAN)🗄️  Accessing PostgreSQL shell...$(NC)"
	docker-compose exec postgres psql -U postgres -d catat_jasamu_db

# Shell access
backend-shell: ## Akses backend container shell
	@echo "$(CYAN)🖥️  Accessing backend shell...$(NC)"
	docker-compose exec backend sh

frontend-shell: ## Akses frontend container shell
	@echo "$(CYAN)🖥️  Accessing frontend shell...$(NC)"
	docker-compose exec frontend sh

# Production build
prod: ## Build dan jalankan production
	@echo "$(GREEN)🚀 Building and starting production...$(NC)"
	docker-compose build --no-cache
	docker-compose up -d
	@echo "$(GREEN)✅ Production started!$(NC)"

# Logs shortcuts
logs-backend: ## Logs backend saja
	docker-compose logs -f backend

logs-frontend: ## Logs frontend saja
	docker-compose logs -f frontend

logs-postgres: ## Logs postgres saja
	docker-compose logs -f postgres

# Health check
health: ## Cek kesehatan aplikasi
	@echo "$(CYAN)🏥 Checking application health...$(NC)"
	@echo "Backend API:"
	@curl -s http://localhost:5001/health || echo "Backend not responding"
	@echo ""
	@echo "Frontend:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " Frontend OK" || echo "Frontend not responding"
	@echo ""
	@docker-compose ps

# Comprehensive test
test: ## Jalankan comprehensive Docker tests
	@echo "$(CYAN)🧪 Running comprehensive Docker tests...$(NC)"
	@./scripts/docker/test-docker.sh
