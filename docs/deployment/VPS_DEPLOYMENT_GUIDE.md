# 🚀 Catat Jasamu - VPS Deployment Guide

Panduan lengkap untuk deploy aplikasi Catat Jasamu ke VPS dengan domain catatjasamu.com.

## 📋 Prerequisites

- VPS dengan Ubuntu/Debian
- Domain catatjasamu.com dan api.catatjasamu.com
- SSL certificates (Let's Encrypt atau dari CA)
- Docker dan Docker Compose terinstall
- Git terinstall

## 🔧 Setup VPS

### 1. Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for docker group to take effect
```

### 3. Clone Repository
```bash
cd ~
git clone https://github.com/luthfirf17/cj.git catatjasamu
cd catatjasamu
```

### 4. Setup Environment Variables
```bash
# Copy production environment file
cp .env.production .env

# Edit with your actual values
nano .env
```

**Isi file .env dengan nilai yang benar:**
```env
# Domain Configuration
DOMAIN=https://catatjasamu.com
FRONTEND_URL=https://catatjasamu.com
BACKEND_URL=https://api.catatjasamu.com

# Google OAuth (dapatkan dari Google Cloud Console)
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_CALLBACK_URL=https://api.catatjasamu.com/api/auth/google/callback

# Google Calendar (OAuth client terpisah atau yang sama dengan scope calendar)
GOOGLE_CALENDAR_CLIENT_ID=your_actual_calendar_client_id
GOOGLE_CALENDAR_CLIENT_SECRET=your_actual_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://api.catatjasamu.com/api/auth/google/calendar/callback

# Database
DB_PASSWORD=your_secure_database_password

# JWT Secret (generate random string)
JWT_SECRET=your_random_jwt_secret_at_least_32_characters
```

### 5. Setup SSL Certificates

**Opsi 1: Let's Encrypt (Gratis)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificates
sudo certbot certonly --standalone -d catatjasamu.com -d www.catatjasamu.com
sudo certbot certonly --standalone -d api.catatjasamu.com

# Certificates will be in /etc/letsencrypt/live/
```

**Opsi 2: Manual SSL**
Upload certificate files ke server dan update nginx config.

### 6. Configure Nginx untuk SSL

Update `/etc/nginx/sites-available/catatjasamu`:
```nginx
server {
    listen 80;
    server_name catatjasamu.com www.catatjasamu.com api.catatjasamu.com;
    return 301 https://$server_name$request_uri;
}

# Frontend (catatjasamu.com)
server {
    listen 443 ssl http2;
    server_name catatjasamu.com www.catatjasamu.com;

    ssl_certificate /etc/letsencrypt/live/catatjasamu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/catatjasamu.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API (api.catatjasamu.com)
server {
    listen 443 ssl http2;
    server_name api.catatjasamu.com;

    ssl_certificate /etc/letsencrypt/live/api.catatjasamu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.catatjasamu.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 7. Deploy Aplikasi

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

### 8. Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 🔍 Testing Deployment

### 1. Check Services
```bash
docker-compose -f docker/docker-compose.yml ps
docker-compose -f docker/docker-compose.yml logs
```

### 2. Test Endpoints
```bash
# Frontend
curl -I https://catatjasamu.com

# Backend API
curl -I https://api.catatjasamu.com/api/health
```

### 3. Test Features
- Akses https://catatjasamu.com
- Test login dengan Google OAuth
- Test Google Calendar integration
- Test fitur booking link

## 🔄 Update Deployment

Untuk update kode di VPS:
```bash
cd ~/catatjasamu
git pull origin main
./scripts/deploy.sh
```

## 🐛 Troubleshooting

### Logs
```bash
# All services
docker-compose -f docker/docker-compose.yml logs

# Specific service
docker-compose -f docker/docker-compose.yml logs backend
docker-compose -f docker/docker-compose.yml logs frontend
```

### Common Issues

1. **SSL Certificate Issues**
   - Pastikan certificate paths benar di nginx config
   - Renew certificates: `sudo certbot renew`

2. **Database Connection**
   - Check DB_PASSWORD di .env
   - Verify postgres container is running

3. **Google OAuth**
   - Pastikan redirect URIs di Google Cloud Console sesuai domain
   - Check GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET

4. **Port Conflicts**
   - Pastikan port 80, 443, 5001 tidak digunakan aplikasi lain

## 📞 Support

Jika ada masalah, check logs dan pastikan semua environment variables sudah benar.