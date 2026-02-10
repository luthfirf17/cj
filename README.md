# 🚀 Catat Jasamu - Aplikasi Manajemen Bisnis Musik

Aplikasi web modern untuk mengelola bisnis musik (studio rekaman, les musik, dll) dengan fitur lengkap manajemen klien, booking, pembayaran, dan laporan keuangan.

## ✨ Fitur Utama

- 👥 **Manajemen Klien** - CRUD data klien dengan informasi lengkap
- 🎵 **Manajemen Layanan** - Katalog layanan dengan sistem pricing
- 📅 **Booking System** - Sistem booking otomatis dengan validasi
- 💰 **Tracking Pembayaran** - Real-time payment tracking dengan cicilan
- 📊 **Dashboard Analytics** - Visualisasi data dan laporan keuangan
- 📦 **Backup & Restore** - Export/Import data dengan deteksi duplikat
- 🔐 **Security System** - JWT authentication + PIN security
- 👤 **Multi-User** - Role-based access (Admin/User)

## 🛠️ Teknologi

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + PostgreSQL
- **Deployment**: Docker + Nginx + SSL
- **Authentication**: JWT + bcrypt

## 🚀 Quick Start

### Menggunakan Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/luthfirf17/cj.git
cd cj

# Jalankan dengan Docker
docker compose up -d

# Akses aplikasi
# Frontend: http://localhost:3000
# Backend:  http://localhost:5001
```

### Manual Setup

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database PostgreSQL
# Copy .env files dan konfigurasi

# Run migrations
cd backend && npm run migrate

# Start servers
npm run dev  # Backend
cd ../frontend && npm run dev  # Frontend
```

## 📚 Dokumentasi

### 🔥 Wajib Baca
- 🚀 **[Panduan Deployment & Update](DEPLOYMENT.md)** — Aturan update kode, cara deploy, perintah VPS, troubleshooting
- 📋 **[Environment Variables](docker/.env.example)** — Template konfigurasi environment

### Dokumentasi Lainnya
- 📖 **[Dokumentasi Lengkap](docs/)** — Semua panduan, API docs, dan troubleshooting
- 🔧 **[Setup Guide](docs/setup/INSTALLATION.md)** — Instalasi lengkap
- 🔌 **[API Documentation](docs/api/API_OVERVIEW.md)** — API reference
- 🏗️ **[Architecture](docs/architecture/STRUKTUR_APLIKASI.md)** — System design
- 🔐 **[Security Guide](docs/security/AUTHENTICATION_GUIDE.md)** — Authentication & security

## 👨‍💻 Author

**Cep Luthfi Rizky Fauzi**
- 📧 Email: catatjasamu@gmail.com
- 🐙 GitHub: [@luthfirf17](https://github.com/luthfirf17)
- 📍 Location: Tasikmalaya, Jawa Barat, Indonesia

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](docs/LICENSE) file for details.

---

⭐ **Jangan lupa beri star jika project ini membantu!**

Made with ❤️ by [Luthfi RF](https://github.com/luthfirf17)