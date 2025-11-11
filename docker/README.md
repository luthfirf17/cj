# 🐳 Docker Configuration

Folder ini berisi semua konfigurasi Docker untuk project Catat Jasamu.

## 📂 Files

```
docker/
├── docker-compose.yml       # Production configuration
├── docker-compose.dev.yml   # Development configuration
└── .env.docker              # Environment template
```

## 🚀 Quick Start

### From Root Directory (Recommended)

Gunakan symlinks yang sudah dibuat di root directory:

```bash
# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d

# Atau gunakan Makefile
make up      # Production
make dev     # Development
```

### From Docker Directory

```bash
cd docker

# Production
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml up -d
```

## 📋 Configuration Files

### `docker-compose.yml` (Production)

Services:
- **postgres**: PostgreSQL 15 database
- **backend**: Node.js API (optimized)
- **frontend**: React app dengan Nginx

Features:
- ✅ Optimized build
- ✅ Production-ready
- ✅ Nginx for static files
- ✅ Health checks
- ❌ No hot-reload

### `docker-compose.dev.yml` (Development)

Services:
- **postgres**: PostgreSQL 15 database
- **backend**: Node.js API dengan nodemon
- **frontend**: React app dengan Vite dev server

Features:
- ✅ Hot-reload enabled
- ✅ Volume mounts
- ✅ Fast development
- ✅ Live debugging
- ⚠️ Not optimized

### `.env.docker` (Environment Template)

Template untuk environment variables. Copy dan sesuaikan:

```bash
cp .env.docker ../.env
# Edit .env sesuai kebutuhan
```

## 🔧 Usage

### Production Mode

```bash
# Start
docker-compose up -d

# Logs
docker-compose logs -f

# Stop
docker-compose down
```

### Development Mode

```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

## 📍 Access Points

After starting:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health
- **PostgreSQL**: localhost:5432

## 🛠️ Maintenance

### Rebuild

```bash
# Production
docker-compose build --no-cache
docker-compose up -d

# Development
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes too (CAUTION: deletes data)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## 📚 Documentation

Untuk dokumentasi lengkap, lihat:

- **Setup Guide**: [../docs/setup/DOCKER_SETUP.md](../docs/setup/DOCKER_SETUP.md)
- **Quick Reference**: [../docs/setup/DOCKER_QUICK_REFERENCE.md](../docs/setup/DOCKER_QUICK_REFERENCE.md)
- **Installation Complete**: [../docs/setup/DOCKER_INSTALLATION_COMPLETE.md](../docs/setup/DOCKER_INSTALLATION_COMPLETE.md)

## 💡 Tips

1. **Use Makefile**: Lebih mudah dari root directory dengan `make` commands
2. **Development**: Gunakan dev mode saat coding untuk hot-reload
3. **Production**: Test dengan prod mode sebelum deploy
4. **Logs**: Selalu cek logs jika ada masalah
5. **Backup**: Backup database secara berkala

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check ports
lsof -i :3000  # Frontend
lsof -i :5001  # Backend
lsof -i :5432  # PostgreSQL

# Or change ports in docker-compose.yml
```

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Error

```bash
# Check postgres health
docker-compose exec postgres pg_isready -U postgres

# Restart postgres
docker-compose restart postgres
```

---

**Pro Tip**: Gunakan `make help` dari root directory untuk melihat semua available commands! 🚀
