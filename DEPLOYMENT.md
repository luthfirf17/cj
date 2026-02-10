# 📘 CatatJasamu — Panduan Pengembangan & Deployment

> **Catat Jasamu** adalah aplikasi web untuk mencatat dan mengelola booking jasa.  
> Dibangun dengan **React + Vite** (frontend) dan **Node.js + Express** (backend), menggunakan **PostgreSQL** sebagai database, dan di-deploy menggunakan **Docker** di VPS Hostinger.

---

## 📑 Daftar Isi

1. [Arsitektur Sistem](#-arsitektur-sistem)
2. [Struktur Folder](#-struktur-folder)
3. [Menjalankan di Local (Development)](#-menjalankan-di-local-development)
4. [Aturan Update Kode](#-aturan-update-kode)
5. [Deploy ke VPS (Production)](#-deploy-ke-vps-production)
6. [Update Deploy (Yang Paling Sering Dilakukan)](#-update-deploy-yang-paling-sering-dilakukan)
7. [Perintah Berguna di VPS](#-perintah-berguna-di-vps)
8. [Troubleshooting](#-troubleshooting)
9. [Google Cloud Console](#-google-cloud-console)

---

## 🏗 Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────┐
│                    INTERNET (User)                        │
│                 https://catatjasamu.com                   │
└─────────────────────┬────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────┐
│              HOST NGINX (Port 80/443)                     │
│         SSL/TLS Termination (Let's Encrypt)               │
│                                                           │
│   /api/*  ──► http://127.0.0.1:5001  (Backend Docker)    │
│   /health ──► http://127.0.0.1:5001  (Backend Docker)    │
│   /*      ──► http://127.0.0.1:3000  (Frontend Docker)   │
└─────────────────────┬────────────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────────────┐
│                DOCKER CONTAINERS                          │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  PostgreSQL  │  │   Backend    │  │    Frontend     │  │
│  │  Port 5432   │◄─│  Port 5001   │  │  Port 3000→80  │  │
│  │  (internal)  │  │  Node.js     │  │  Nginx+React   │  │
│  └─────────────┘  └──────────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**Penting:**
- SSL/HTTPS ditangani oleh **Nginx di host** (bukan di Docker)
- Frontend dan Backend diakses melalui **domain yang sama** (`catatjasamu.com`)
- Frontend mengakses API via `/api/*` (same-origin, tidak perlu CORS)

---

## 📁 Struktur Folder

```
CatatJasamu/
├── backend/                 # 🟢 Backend (Node.js + Express)
│   ├── Dockerfile           #    Dockerfile production
│   ├── Dockerfile.dev       #    Dockerfile development (hot-reload)
│   ├── package.json
│   └── src/
│       ├── server.js        #    Entry point utama
│       ├── config/          #    Konfigurasi database
│       ├── controllers/     #    Logic handler API
│       ├── middlewares/     #    Auth middleware, dll
│       ├── migrations/      #    SQL migration files
│       ├── routes/          #    Routing API
│       ├── services/        #    Business logic (Google Calendar, dll)
│       └── utils/           #    Helper functions
│
├── frontend/                # 🔵 Frontend (React + Vite)
│   ├── Dockerfile           #    Dockerfile production (multi-stage)
│   ├── Dockerfile.dev       #    Dockerfile development (hot-reload)
│   ├── nginx.conf           #    Nginx config di dalam container
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/      #    React components
│       ├── pages/           #    Halaman (Auth, Dashboard, dll)
│       └── services/        #    API service (axios, authService)
│
├── docker/                  # 🐳 Docker Configuration
│   ├── docker-compose.yml          # Default compose
│   ├── docker-compose.dev.yml      # Development (hot-reload)
│   ├── docker-compose.prod.yml     # ✅ PRODUCTION (gunakan ini di VPS)
│   ├── .env                        # ⚠️ Environment variables (JANGAN commit!)
│   └── .env.example                # Template environment variables
│
├── scripts/                 # 📜 Script bantuan
│   ├── deploy-prod.sh       #    Script deploy production
│   └── vps-fixes/           #    Script perbaikan VPS
│
├── docs/                    # 📄 Dokumentasi
└── backups/                 # 💾 Backup data
```

---

## 💻 Menjalankan di Local (Development)

### Prasyarat
- **Docker Desktop** terinstall dan running
- **Git** terinstall
- **Node.js 22+** (opsional, untuk development tanpa Docker)

### Langkah-Langkah

#### 1. Clone Repository
```bash
git clone https://github.com/luthfirf17/cj.git
cd cj
```

#### 2. Jalankan dengan Docker (Recommended)
```bash
# Masuk ke folder docker
cd docker

# Jalankan development mode (dengan hot-reload)
docker compose -f docker-compose.dev.yml up -d

# Cek status
docker ps
```

#### 3. Akses Aplikasi
| Service  | URL                          |
|----------|------------------------------|
| Frontend | http://localhost:3000         |
| Backend  | http://localhost:5001         |
| API      | http://localhost:5001/api     |
| Database | localhost:5433 (user: postgres, pass: 1234) |

#### 4. Menghentikan
```bash
cd docker
docker compose -f docker-compose.dev.yml down
```

> **💡 Tips:** Mode dev menggunakan **hot-reload** — setiap kali kamu save file,  
> perubahan langsung terlihat tanpa restart container.

---

## 📋 Aturan Update Kode

### ⛔ JANGAN PERNAH

| No | Aturan | Alasan |
|----|--------|--------|
| 1 | Jangan commit file `.env` | Berisi password & secret key |
| 2 | Jangan edit kode langsung di VPS | Perubahan hilang saat deploy ulang |
| 3 | Jangan pakai `docker compose.yml` biasa di VPS | Gunakan `docker-compose.prod.yml` |
| 4 | Jangan hapus volume `postgres_data` | Data database production hilang permanen |
| 5 | Jangan ubah port di VPS tanpa update Nginx | Menyebabkan 502 Bad Gateway |

### ✅ SELALU LAKUKAN

| No | Aturan | Cara |
|----|--------|------|
| 1 | Test dulu di local | `docker compose -f docker-compose.dev.yml up` |
| 2 | Commit dengan pesan jelas | `git commit -m "fix: perbaiki login Google"` |
| 3 | Pull di VPS sebelum rebuild | `cd ~/cj && git pull` |
| 4 | Backup database sebelum update besar | Lihat bagian [Backup Database](#backup-database) |
| 5 | Cek logs setelah deploy | `docker logs catatjasamu-backend` |

### 📝 Format Commit Message

Gunakan format ini agar riwayat perubahan rapi:

```
feat: fitur baru                    → Menambah fitur baru
fix: perbaikan bug                  → Memperbaiki bug
style: perubahan tampilan           → CSS, layout, UI
refactor: perbaikan kode            → Refactor tanpa ubah fungsi
docs: update dokumentasi            → README, komentar
chore: maintenance                  → Update dependency, config
```

**Contoh:**
```bash
git commit -m "feat: tambah fitur export PDF booking"
git commit -m "fix: perbaiki Google Calendar redirect URI"
git commit -m "style: perbaiki tampilan mobile dashboard"
```

### 🔀 Alur Kerja Update Kode

```
1. Edit kode di LOCAL
        │
        ▼
2. Test di LOCAL (docker-compose.dev.yml)
        │
        ▼
3. git add & git commit
        │
        ▼
4. git push (ke GitHub)
        │
        ▼
5. Deploy ke VPS (lihat bagian Deploy)
        │
        ▼
6. Verifikasi di https://catatjasamu.com
```

---

## 🚀 Deploy ke VPS (Production)

### Akses VPS
```bash
ssh cj-vps
```
> Jika belum setup SSH alias, gunakan: `ssh root@72.61.142.236`

### Deploy Pertama Kali (Setup Awal)

#### 1. Clone project di VPS
```bash
cd ~
git clone https://github.com/luthfirf17/cj.git
cd cj
```

#### 2. Buat file environment
```bash
cd docker
cp .env.example .env
nano .env    # Edit dan isi semua nilai yang benar
```

#### 3. Build dan jalankan
```bash
cd ~/cj/docker
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

#### 4. Cek semua berjalan
```bash
docker ps
curl http://127.0.0.1:5001/health
curl http://127.0.0.1:3000
```

---

## 🔄 Update Deploy (Yang Paling Sering Dilakukan)

> **Ini adalah bagian terpenting.** Setiap kali kamu sudah push kode baru ke GitHub  
> dan ingin update di VPS, ikuti langkah ini.

### Update Cepat — Backend Saja (Paling Sering)

Jika hanya mengubah kode backend (controller, routes, server.js):

```bash
# 1. Login ke VPS
ssh cj-vps

# 2. Pull kode terbaru
cd ~/cj && git pull

# 3. Rebuild hanya backend
cd docker && docker compose -f docker-compose.prod.yml build --no-cache backend

# 4. Restart backend (tanpa downtime database)
docker compose -f docker-compose.prod.yml up -d backend

# 5. Cek logs (pastikan tidak ada error)
docker logs catatjasamu-backend --tail 20

# 6. Test
curl http://127.0.0.1:5001/health
```

### Update Cepat — Frontend Saja

Jika hanya mengubah tampilan (components, pages, CSS):

```bash
# 1. Login ke VPS
ssh cj-vps

# 2. Pull kode terbaru
cd ~/cj && git pull

# 3. Rebuild hanya frontend
cd docker && docker compose -f docker-compose.prod.yml build --no-cache frontend

# 4. Restart frontend
docker compose -f docker-compose.prod.yml up -d frontend

# 5. Cek
curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000
# Harus muncul: 200
```

### Update Lengkap — Backend + Frontend

Jika mengubah keduanya:

```bash
# 1. Login ke VPS
ssh cj-vps

# 2. Pull kode terbaru
cd ~/cj && git pull

# 3. Rebuild semua
cd docker && docker compose -f docker-compose.prod.yml build --no-cache

# 4. Restart semua (database tetap jalan)
docker compose -f docker-compose.prod.yml up -d

# 5. Cek status
docker ps
docker logs catatjasamu-backend --tail 10
docker logs catatjasamu-frontend --tail 10

# 6. Test endpoint
curl https://catatjasamu.com/health
```

### ⚡ Perintah Satu Baris (Copy-Paste)

```bash
# Update backend saja:
ssh cj-vps "cd ~/cj && git pull && cd docker && docker compose -f docker-compose.prod.yml build --no-cache backend && docker compose -f docker-compose.prod.yml up -d backend && docker logs catatjasamu-backend --tail 10"

# Update frontend saja:
ssh cj-vps "cd ~/cj && git pull && cd docker && docker compose -f docker-compose.prod.yml build --no-cache frontend && docker compose -f docker-compose.prod.yml up -d frontend"

# Update semua:
ssh cj-vps "cd ~/cj && git pull && cd docker && docker compose -f docker-compose.prod.yml build --no-cache && docker compose -f docker-compose.prod.yml up -d && docker ps"
```

---

## 🛠 Perintah Berguna di VPS

### Status & Monitoring

```bash
# Lihat semua container yang berjalan
docker ps

# Lihat logs backend (20 baris terakhir)
docker logs catatjasamu-backend --tail 20

# Lihat logs backend secara real-time (Ctrl+C untuk berhenti)
docker logs -f catatjasamu-backend

# Lihat logs frontend
docker logs catatjasamu-frontend --tail 20

# Cek health
curl https://catatjasamu.com/health

# Cek disk space
df -h

# Cek memory
free -h
```

### Database

```bash
# Masuk ke database (psql)
docker exec -it catatjasamu-postgres psql -U postgres -d catat_jasamu_db

# Query langsung dari luar container
docker exec catatjasamu-postgres psql -U postgres -d catat_jasamu_db -c "SELECT id, email, role FROM users;"

# Lihat semua tabel
docker exec catatjasamu-postgres psql -U postgres -d catat_jasamu_db -c "\dt"

# Jalankan migration SQL tertentu
docker exec catatjasamu-postgres psql -U postgres -d catat_jasamu_db -f /docker-entrypoint-initdb.d/011_add_google_oauth_fields.sql
```

### Backup Database

```bash
# Backup database ke file SQL
docker exec catatjasamu-postgres pg_dump -U postgres catat_jasamu_db > ~/backup_$(date +%Y%m%d_%H%M%S).sql

# Restore dari backup
docker exec -i catatjasamu-postgres psql -U postgres -d catat_jasamu_db < ~/backup_20260210.sql
```

### Restart & Troubleshooting

```bash
# Restart satu container
docker restart catatjasamu-backend
docker restart catatjasamu-frontend

# Stop semua container
cd ~/cj/docker && docker compose -f docker-compose.prod.yml down

# Start semua container
cd ~/cj/docker && docker compose -f docker-compose.prod.yml up -d

# Rebuild total dari nol (hati-hati: JANGAN tambah -v agar database aman)
cd ~/cj/docker && docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# Bersihkan image lama (hemat disk)
docker image prune -f

# Reload Nginx host (setelah edit config Nginx)
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🔧 Troubleshooting

### ❌ "502 Bad Gateway"
**Penyebab:** Backend atau Frontend container mati.
```bash
# Cek container berjalan
docker ps

# Jika container mati, lihat penyebabnya
docker logs catatjasamu-backend --tail 50

# Restart
cd ~/cj/docker && docker compose -f docker-compose.prod.yml up -d
```

### ❌ "password authentication failed for user postgres"
**Penyebab:** Password di .env tidak cocok dengan password di volume database lama.
```bash
# Reset password postgres
docker exec catatjasamu-postgres psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'password_baru_kamu';"

# Restart backend
docker restart catatjasamu-backend
```

### ❌ Frontend build gagal (npm error)
**Penyebab:** `package-lock.json` tidak sinkron dengan `package.json`.
```bash
# Pastikan Dockerfile frontend menggunakan npm install (bukan npm ci)
grep "npm install\|npm ci" ~/cj/frontend/Dockerfile
# Harus: RUN npm install
```

### ❌ "redirect_uri_mismatch" saat Google OAuth
**Penyebab:** URI belum terdaftar di Google Cloud Console.
```
Buka: https://console.cloud.google.com → Credentials → OAuth Client ID
Tambahkan URI yang sesuai di "Authorized redirect URIs"

URI Production yang HARUS ada:
  - https://catatjasamu.com/api/auth/google/callback         (Login)
  - https://catatjasamu.com/api/user/google-calendar/callback (Calendar)
```

### ❌ Perubahan kode tidak muncul setelah deploy
**Penyebab:** Docker cache image lama.
```bash
# Rebuild tanpa cache
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### ❌ Database migration belum jalan
**Penyebab:** Migration hanya auto-run saat database pertama kali dibuat.
```bash
# Jalankan migration manual
docker exec catatjasamu-postgres psql -U postgres -d catat_jasamu_db \
  -f /docker-entrypoint-initdb.d/NAMA_FILE_MIGRATION.sql
```

---

## 🌐 Google Cloud Console

### Authorized Redirect URIs yang Harus Ada

Di [Google Cloud Console](https://console.cloud.google.com) → **Clients** → OAuth Client ID:

| URI | Fungsi |
|-----|--------|
| `http://localhost:5001/api/auth/google/callback` | Dev - Login |
| `http://localhost:5001/api/user/google-calendar/callback` | Dev - Calendar |
| `http://localhost:3000/api/auth/google/callback` | Dev - Login (via frontend proxy) |
| `https://catatjasamu.com/api/auth/google/callback` | **Prod - Login** |
| `https://catatjasamu.com/api/user/google-calendar/callback` | **Prod - Calendar** |

### Publish App (dari Testing → Production)

1. Buka **Audience** → Klik **"Publish App"** → **Confirm**
2. Di **Branding**, pastikan sudah diisi:
   - App name: `Catat Jasamu`
   - User support email: email kamu
   - App homepage: `https://catatjasamu.com`
   - Privacy policy: `https://catatjasamu.com/privacy` (buat halaman ini)
   - Terms of service: `https://catatjasamu.com/terms` (buat halaman ini)
3. Karena app menggunakan **sensitive scope** (Calendar), Google akan menampilkan warning "This app isn't verified" ke user — tapi user masih bisa klik "Advanced" → "Go to Catat Jasamu (unsafe)" untuk lanjut. Untuk menghilangkan warning ini, kamu perlu submit verification ke Google.

### Test Users (Mode Testing)
Saat masih mode Testing, hanya email yang ada di daftar **Test Users** yang bisa login. Tambahkan email di **Audience** → **Test users** → **+ Add users**.

---

## 📌 Ringkasan Perintah Cepat

| Aksi | Perintah |
|------|----------|
| Akses VPS | `ssh cj-vps` |
| Pull kode terbaru | `cd ~/cj && git pull` |
| Build backend | `cd ~/cj/docker && docker compose -f docker-compose.prod.yml build --no-cache backend` |
| Build frontend | `cd ~/cj/docker && docker compose -f docker-compose.prod.yml build --no-cache frontend` |
| Build semua | `cd ~/cj/docker && docker compose -f docker-compose.prod.yml build --no-cache` |
| Start/restart | `cd ~/cj/docker && docker compose -f docker-compose.prod.yml up -d` |
| Stop semua | `cd ~/cj/docker && docker compose -f docker-compose.prod.yml down` |
| Lihat status | `docker ps` |
| Lihat logs | `docker logs catatjasamu-backend --tail 20` |
| Masuk database | `docker exec -it catatjasamu-postgres psql -U postgres -d catat_jasamu_db` |
| Backup database | `docker exec catatjasamu-postgres pg_dump -U postgres catat_jasamu_db > ~/backup.sql` |
| Bersihkan image | `docker image prune -f` |
| Cek health | `curl https://catatjasamu.com/health` |

---

> **📞 Bantuan:** Jika ada masalah, selalu cek logs dulu:  
> `docker logs catatjasamu-backend --tail 50`  
> Ini akan menunjukkan error yang terjadi.
