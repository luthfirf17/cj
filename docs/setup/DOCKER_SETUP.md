# 🐳 Docker Setup - Catat Jasamu

Dokumentasi lengkap untuk menjalankan aplikasi Catat Jasamu menggunakan Docker.

## 📋 Prerequisites

Sebelum memulai, pastikan sudah terinstall:

- [Docker Desktop](https://www.docker.com/products/docker-desktop) (versi terbaru)
- [Docker Compose](https://docs.docker.com/compose/install/) (biasanya sudah include di Docker Desktop)

Verifikasi instalasi:
```bash
docker --version
docker-compose --version
```

## 🚀 Quick Start

### 1. Clone dan Setup

```bash
cd /path/to/CatatJasamu
```

### 2. Jalankan dengan Docker Compose

```bash
# Build dan jalankan semua services
docker-compose up -d

# Atau untuk melihat logs
docker-compose up
```

### 3. Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **PostgreSQL**: localhost:5432

### 4. Inisialisasi Database

Database akan otomatis dibuat saat pertama kali dijalankan. Migration files di `backend/src/migrations/` akan dijalankan otomatis.

Jika perlu menjalankan migration manual:
```bash
docker-compose exec backend npm run migrate
```

## 📦 Docker Services

### 1. PostgreSQL Database
- **Container**: `catatjasamu-postgres`
- **Image**: `postgres:15-alpine`
- **Port**: 5432
- **Volume**: `postgres_data` (persistent storage)

### 2. Backend API (Node.js)
- **Container**: `catatjasamu-backend`
- **Port**: 5001
- **Framework**: Express.js
- **Database**: PostgreSQL

### 3. Frontend (React)
- **Container**: `catatjasamu-frontend`
- **Port**: 3000 (mapped to 80 internal)
- **Framework**: React + Vite
- **Server**: Nginx

## 🛠️ Docker Commands

### Menjalankan Aplikasi

```bash
# Start semua services
docker-compose up -d

# Start dengan rebuild
docker-compose up -d --build

# Start service tertentu
docker-compose up -d postgres
docker-compose up -d backend
docker-compose up -d frontend
```

### Menghentikan Aplikasi

```bash
# Stop semua services
docker-compose down

# Stop dan hapus volumes (HATI-HATI: data akan hilang)
docker-compose down -v

# Stop service tertentu
docker-compose stop backend
```

### Melihat Logs

```bash
# Logs semua services
docker-compose logs -f

# Logs service tertentu
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart semua
docker-compose restart

# Restart service tertentu
docker-compose restart backend
docker-compose restart frontend
```

### Melihat Status

```bash
# List running containers
docker-compose ps

# Detail container info
docker ps
```

### Akses Container Shell

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# PostgreSQL shell
docker-compose exec postgres psql -U postgres -d catat_jasamu_db
```

## 🔧 Development Mode

Untuk development dengan hot-reload:

```bash
# Backend (dengan nodemon)
docker-compose exec backend npm run dev

# Frontend (sudah otomatis rebuild di container)
```

Atau edit `docker-compose.yml` untuk menambahkan volume mount:

```yaml
backend:
  volumes:
    - ./backend:/app
    - /app/node_modules
  command: npm run dev
```

## 🗄️ Database Management

### Backup Database

```bash
# Backup ke file
docker-compose exec postgres pg_dump -U postgres catat_jasamu_db > backup.sql

# Atau menggunakan script backup yang sudah ada
docker-compose exec backend node scripts/backup-data-nodejs.js
```

### Restore Database

```bash
# Restore dari file SQL
docker-compose exec -T postgres psql -U postgres catat_jasamu_db < backup.sql
```

### Akses PostgreSQL

```bash
# Via psql
docker-compose exec postgres psql -U postgres -d catat_jasamu_db

# Query langsung
docker-compose exec postgres psql -U postgres -d catat_jasamu_db -c "SELECT * FROM users;"
```

## 🔐 Environment Variables

Edit file `.env.docker` atau langsung di `docker-compose.yml`:

```env
# Backend
PORT=5001
NODE_ENV=production

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=catat_jasamu_db
DB_USER=postgres
DB_PASSWORD=1234

# JWT
JWT_SECRET=catat-jasamu-secret-key-2025
JWT_EXPIRE=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

## 🐛 Troubleshooting

### Port sudah digunakan

```bash
# Cek port yang digunakan
lsof -i :5432  # PostgreSQL
lsof -i :5001  # Backend
lsof -i :3000  # Frontend

# Atau ubah port di docker-compose.yml
ports:
  - "5433:5432"  # Ubah port host
```

### Database connection error

```bash
# Cek status postgres
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Cek logs
docker-compose logs postgres
```

### Frontend tidak bisa akses backend

Pastikan `VITE_API_BASE_URL` di frontend sudah benar:
```javascript
// frontend/src/services/api.js
const API_BASE_URL = 'http://localhost:5001/api';
```

### Rebuild dari awal

```bash
# Hapus semua container, images, dan volumes
docker-compose down -v --rmi all

# Rebuild dan start
docker-compose up -d --build
```

### Permission issues di Mac/Linux

```bash
# Berikan akses ke folder
chmod -R 755 backend frontend

# Atau jalankan dengan sudo
sudo docker-compose up -d
```

## 📊 Monitoring

### Resource Usage

```bash
# Lihat penggunaan CPU, memory
docker stats

# Specific container
docker stats catatjasamu-backend
```

### Health Check

```bash
# Cek health status
docker-compose ps

# Backend API health
curl http://localhost:5001/health

# Frontend
curl http://localhost:3000
```

## 🚢 Production Deployment

### Build Production Images

```bash
# Build semua images
docker-compose build --no-cache

# Tag untuk registry
docker tag catatjasamu-backend:latest your-registry/catatjasamu-backend:v1.0.0
docker tag catatjasamu-frontend:latest your-registry/catatjasamu-frontend:v1.0.0

# Push ke registry
docker push your-registry/catatjasamu-backend:v1.0.0
docker push your-registry/catatjasamu-frontend:v1.0.0
```

### Environment untuk Production

Buat file `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  backend:
    environment:
      NODE_ENV: production
      DB_PASSWORD: ${DB_PASSWORD}  # Dari environment
      JWT_SECRET: ${JWT_SECRET}
```

Jalankan:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🧹 Cleanup

```bash
# Hapus stopped containers
docker-compose rm

# Hapus unused images
docker image prune -a

# Hapus unused volumes
docker volume prune

# Clean semua
docker system prune -a --volumes
```

## 📝 Notes

- Data PostgreSQL disimpan di Docker volume `postgres_data` (persistent)
- Frontend menggunakan Nginx untuk serving static files
- Backend menggunakan Node.js dengan Express
- Hot-reload hanya untuk development mode

## 🆘 Support

Jika ada masalah:
1. Cek logs: `docker-compose logs -f`
2. Restart services: `docker-compose restart`
3. Rebuild: `docker-compose up -d --build`
4. Reset total: `docker-compose down -v && docker-compose up -d --build`

---

**Happy Dockerizing! 🐳**
