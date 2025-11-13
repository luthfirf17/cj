# 🚀 Panduan Deployment Aplikasi Catat Jasamu

Panduan lengkap untuk deploy aplikasi Catat Jasamu dari awal hingga production.

## 📋 Daftar Isi

- [Prerequisites](#prerequisites)
- [Setup Server](#setup-server)
- [Clone Repository](#clone-repository)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Build Frontend](#build-frontend)
- [Docker Deployment](#docker-deployment)
- [Nginx Reverse Proxy](#nginx-reverse-proxy)
- [SSL Certificate](#ssl-certificate)
- [Domain Configuration](#domain-configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## 🛠️ Prerequisites

### Sistem Requirements
- Ubuntu 20.04+ atau Debian-based Linux
- Minimum 2GB RAM, 20GB storage
- Domain name (contoh: catatjasamu.com)
- SSH access ke server

### Tools yang Dibutuhkan
- Git
- Docker & Docker Compose
- Node.js & npm
- Nginx
- Certbot (untuk SSL)

## 🚀 Setup Server

### 1. Update Sistem
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Git
```bash
sudo apt install git -y
git --version
```

### 3. Install Docker & Docker Compose
```bash
# Install dependencies
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release -y

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y

# Setup Docker permissions
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

### 4. Install Node.js
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### 5. Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 📥 Clone Repository

```bash
# Clone repository
cd ~
git clone https://github.com/luthfirf17/cj.git
cd cj

# Verify structure
ls -la
```

## ⚙️ Environment Setup

### 1. Setup Environment Files
```bash
# Copy environment templates
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env

# Edit frontend environment
nano frontend/.env
```

**frontend/.env:**
```env
VITE_API_URL=https://catatjasamu.com
```

**backend/.env:**
```env
# Environment
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
FRONTEND_URL=https://catatjasamu.com
```

### 2. Update Docker Compose
```bash
nano docker-compose.yml
```

**Pastikan environment variables:**
```yaml
services:
  frontend:
    environment:
      VITE_API_URL: https://catatjasamu.com

  backend:
    environment:
      FRONTEND_URL: https://catatjasamu.com
```

## 🗄️ Database Setup

### 1. Create Database Directory
```bash
sudo mkdir -p /opt/catatjasamu/postgres_data
sudo chown -R $USER:$USER /opt/catatjasamu
```

### 2. Run Database Migration
```bash
# Start only database first
docker compose up postgres -d

# Wait for database ready
sleep 30

# Run migrations
docker exec cj-backend npm run db:migrate

# Check tables created
docker exec cj-postgres psql -U postgres -d catat_jasamu_db -c "\dt"
```

## 🎨 Build Frontend

```bash
# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Verify build output
ls -la dist/
cd ..
```

## 🐳 Docker Deployment

### 1. Build and Start Services
```bash
# Build and start all services
docker compose up --build -d

# Check services status
docker compose ps

# View logs
docker compose logs
```

### 2. Verify Services
```bash
# Check container health
docker compose ps -a

# Test backend API
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'

# Test frontend serving
curl -I http://localhost:3000
```

## 🌐 Nginx Reverse Proxy

### 1. Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/catatjasamu.com
```

**Isi konfigurasi:**
```nginx
# HTTP Server Block - Redirect to HTTPS
server {
    listen 80;
    server_name catatjasamu.com www.catatjasamu.com;

    # Redirect www to non-www
    if ($host = www.catatjasamu.com) {
        return 301 http://catatjasamu.com$request_uri;
    }

    # Redirect HTTP to HTTPS
    return 301 https://catatjasamu.com$request_uri;
}

# HTTPS Server Block
server {
    listen 443 ssl http2;
    server_name catatjasamu.com www.catatjasamu.com;

    # SSL Configuration (akan ditambahkan Certbot)
    ssl_certificate /etc/letsencrypt/live/catatjasamu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/catatjasamu.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Redirect www to non-www
    if ($host = www.catatjasamu.com) {
        return 301 https://catatjasamu.com$request_uri;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://catatjasamu.com' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;

        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://catatjasamu.com';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Logs
    access_log /var/log/nginx/catatjasamu.com_access.log;
    error_log /var/log/nginx/catatjasamu.com_error.log;
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/catatjasamu.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 🔒 SSL Certificate

### 1. Install Certbot
```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Get SSL Certificate
```bash
sudo certbot --nginx -d catatjasamu.com -d www.catatjasamu.com
```

### 3. Setup Auto-Renewal
```bash
sudo crontab -e
# Tambahkan baris:
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🌍 Domain Configuration

### 1. DNS Setup
Di domain registrar (Hostinger/GoDaddy/etc), tambahkan A records:

```
Type: A
Name: @
Value: [YOUR_SERVER_IP]
TTL: 3600

Type: A
Name: www
Value: [YOUR_SERVER_IP]
TTL: 3600
```

### 2. Verify DNS
```bash
nslookup catatjasamu.com
nslookup www.catatjasamu.com
```

## 🧪 Testing

### 1. Test HTTP Redirect
```bash
curl -I http://catatjasamu.com
# Should return 301 redirect to HTTPS
```

### 2. Test HTTPS
```bash
curl -I https://catatjasamu.com
# Should return 200 OK
```

### 3. Test API
```bash
# Test registration
curl -X POST https://catatjasamu.com/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Origin: https://catatjasamu.com" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "test123456"
  }'

# Test login
curl -X POST https://catatjasamu.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: https://catatjasamu.com" \
  -d '{
    "email": "test@example.com",
    "password": "test123456"
  }'
```

### 4. Test di Browser
1. Buka `https://catatjasamu.com`
2. Register/Login
3. Check console untuk error
4. Test semua fitur aplikasi

## 🔧 Troubleshooting

### Common Issues

#### 1. Mixed Content Error
**Problem:** Browser shows "Mixed Content" error
**Solution:**
```bash
# Update frontend environment
nano frontend/.env
# Change: VITE_API_URL=https://catatjasamu.com

# Rebuild frontend
cd frontend && npm run build && cd ..

# Restart containers
docker compose down && docker compose up --build -d
```

#### 2. API 404 Error
**Problem:** API returns 404
**Solution:**
```bash
# Check Nginx config
sudo nginx -t

# Check proxy_pass in /etc/nginx/sites-available/catatjasamu.com
# Should be: proxy_pass http://localhost:5001/api/;

# Reload Nginx
sudo systemctl reload nginx
```

#### 3. Database Connection Error
**Problem:** Backend cannot connect to database
**Solution:**
```bash
# Check database container
docker compose ps

# Check database logs
docker compose logs postgres

# Test database connection
docker exec cj-postgres psql -U postgres -d catat_jasamu_db -c "SELECT 1;"
```

#### 4. SSL Certificate Issues
**Problem:** SSL not working
**Solution:**
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

#### 5. Container Not Starting
**Problem:** Docker containers fail to start
**Solution:**
```bash
# Check logs
docker compose logs

# Rebuild containers
docker compose down
docker compose up --build -d

# Check resource usage
docker stats
```

## 🛠️ Maintenance

### Regular Tasks

#### 1. Update Application
```bash
cd ~/cj
git pull origin main
docker compose down
docker compose up --build -d
```

#### 2. Backup Database
```bash
# Manual backup
docker exec cj-postgres pg_dump -U postgres catat_jasamu_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup (add to crontab)
0 2 * * * docker exec cj-postgres pg_dump -U postgres catat_jasamu_db > /home/ubuntu/backup_$(date +\%Y\%m\%d).sql
```

#### 3. Monitor Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/catatjasamu.com_access.log
sudo tail -f /var/log/nginx/catatjasamu.com_error.log

# Application logs
docker compose logs -f backend
docker compose logs -f frontend
```

#### 4. Check SSL Certificate
```bash
# Check expiry date
openssl s_client -connect catatjasamu.com:443 -servername catatjasamu.com 2>/dev/null | openssl x509 -noout -dates

# Manual renew
sudo certbot renew
```

#### 5. Update System
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

### Performance Monitoring

#### 1. Check Resource Usage
```bash
# Docker stats
docker stats

# System resources
htop
df -h
free -h
```

#### 2. Database Optimization
```bash
# Check database size
docker exec cj-postgres psql -U postgres -d catat_jasamu_db -c "SELECT pg_size_pretty(pg_database_size('catat_jasamu_db'));"

# Vacuum database
docker exec cj-postgres psql -U postgres -d catat_jasamu_db -c "VACUUM ANALYZE;"
```

## 📞 Support

Jika mengalami masalah selama deployment:

1. Check logs: `docker compose logs`
2. Test API: `curl -X POST https://catatjasamu.com/api/auth/login`
3. Check Nginx: `sudo nginx -t`
4. Verify SSL: `openssl s_client -connect catatjasamu.com:443`

## 🎯 Quick Reference

### Emergency Commands
```bash
# Restart all services
docker compose restart

# Rebuild everything
docker compose down && docker compose up --build -d

# Check all logs
docker compose logs

# Test full application
curl -I https://catatjasamu.com && echo "Frontend OK"
curl -X POST https://catatjasamu.com/api/auth/login -H "Content-Type: application/json" -d '{}' && echo "API OK"
```

### File Locations
- **Nginx config:** `/etc/nginx/sites-available/catatjasamu.com`
- **SSL certificates:** `/etc/letsencrypt/live/catatjasamu.com/`
- **Application logs:** `/var/log/nginx/catatjasamu.com_*.log`
- **Database backups:** `~/backup_*.sql`

---

**🎉 Deployment selesai! Aplikasi Catat Jasamu siap digunakan di `https://catatjasamu.com`**