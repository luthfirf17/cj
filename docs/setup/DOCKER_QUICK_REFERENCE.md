# 🐳 Docker Quick Reference - Catat Jasamu

Quick reference untuk command Docker yang sering digunakan.

## 🚀 Quick Start

### Menggunakan Setup Script (Recommended)
```bash
./docker-setup.sh
```
Script akan menanyakan mode (Production/Development) dan setup otomatis.

### Menggunakan Makefile (Recommended)
```bash
make help          # Lihat semua commands
make up            # Start production
make dev           # Start development
make down          # Stop
make logs          # Lihat logs
```

### Manual dengan Docker Compose
```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

## 📦 Basic Commands

| Command | Description |
|---------|-------------|
| `make up` atau `docker-compose up -d` | Start production mode |
| `make dev` | Start development mode |
| `make down` | Stop semua services |
| `make restart` | Restart semua services |
| `make logs` | Lihat logs real-time |
| `make ps` | Lihat status containers |

## 🔧 Development Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start dengan hot-reload |
| `make dev-logs` | Logs development mode |
| `make dev-down` | Stop development mode |

## 🗄️ Database Commands

| Command | Description |
|---------|-------------|
| `make migrate` | Jalankan migrations |
| `make backup` | Backup database |
| `make restore FILE=backup.sql` | Restore database |
| `make db-shell` | Akses PostgreSQL shell |

## 🔍 Monitoring & Debugging

| Command | Description |
|---------|-------------|
| `make logs` | Logs semua services |
| `make logs-backend` | Logs backend saja |
| `make logs-frontend` | Logs frontend saja |
| `make logs-postgres` | Logs database saja |
| `make health` | Health check |
| `docker stats` | Resource usage |

## 🛠️ Maintenance

| Command | Description |
|---------|-------------|
| `make rebuild` | Rebuild dari awal |
| `make clean` | Hapus semua (HATI-HATI!) |
| `make backend-shell` | Shell backend container |
| `make frontend-shell` | Shell frontend container |

## 📝 Common Workflows

### 1. First Time Setup
```bash
# Clone project
git clone <repo-url>
cd CatatJasamu

# Setup dengan script
./docker-setup.sh

# Atau manual
docker-compose up -d

# Tunggu services ready
docker-compose ps

# Akses aplikasi
open http://localhost:3000
```

### 2. Development Workflow
```bash
# Start development mode
make dev

# Lihat logs
make dev-logs

# Code changes akan auto-reload

# Stop
make dev-down
```

### 3. Database Backup & Restore
```bash
# Backup
make backup
# Output: backup_20231111_143022.sql

# Restore
make restore FILE=backup_20231111_143022.sql
```

### 4. Debugging Issues
```bash
# Cek status
make ps

# Lihat logs error
make logs

# Restart service bermasalah
docker-compose restart backend

# Atau rebuild total
make rebuild
```

### 5. Production Deployment
```bash
# Build untuk production
make prod

# Atau manual
docker-compose build --no-cache
docker-compose up -d

# Monitor
make health
make logs
```

## 🔑 Environment Variables

### Production (.env or docker-compose.yml)
```env
NODE_ENV=production
DB_HOST=postgres
DB_PORT=5432
DB_NAME=catat_jasamu_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
```

### Development
```env
NODE_ENV=development
DB_HOST=postgres
# ... sama seperti production
```

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Cek port yang digunakan
lsof -i :3000  # Frontend
lsof -i :5001  # Backend
lsof -i :5432  # PostgreSQL

# Atau ubah port di docker-compose.yml
```

### Container Won't Start
```bash
# Lihat logs
make logs

# Rebuild
make rebuild

# Reset total
make clean
docker-compose up -d --build
```

### Database Connection Error
```bash
# Cek postgres health
docker-compose exec postgres pg_isready -U postgres

# Restart postgres
docker-compose restart postgres

# Lihat logs
make logs-postgres
```

### Permission Issues
```bash
# Berikan permission
chmod -R 755 backend frontend

# Atau jalankan dengan sudo (Mac/Linux)
sudo docker-compose up -d
```

## 📊 Useful Docker Commands

### Container Management
```bash
# List containers
docker ps                    # Running
docker ps -a                 # All

# Stop/Start specific
docker stop <container-id>
docker start <container-id>

# Remove container
docker rm <container-id>
```

### Image Management
```bash
# List images
docker images

# Remove image
docker rmi <image-id>

# Prune unused
docker image prune -a
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect <volume-name>

# Remove volume
docker volume rm <volume-name>
```

### System Cleanup
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Clean everything
docker system prune -a --volumes
```

## 🔐 Security Best Practices

1. **Jangan commit .env** - Gunakan .env.example
2. **Ganti password default** - DB_PASSWORD, JWT_SECRET
3. **Gunakan secrets** untuk production
4. **Regular updates** - Docker images & dependencies
5. **Monitor logs** - Cek security issues

## 📞 Support

Jika ada masalah:
1. Cek `make logs` untuk error details
2. Coba `make rebuild`
3. Baca [DOCKER_SETUP.md](DOCKER_SETUP.md) untuk panduan lengkap
4. Reset total dengan `make clean` lalu `make up`

---

**Pro Tip**: Gunakan `make help` untuk melihat semua available commands! 🚀
