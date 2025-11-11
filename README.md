# 🎯 CatatJasamu - Sistem Manajemen Bisnis

Aplikasi web untuk mengelola bisnis jasa event organizer, meliputi manajemen klien, layanan, booking, pembayaran, dan laporan keuangan.

---

## 📋 Deskripsi

**CatatJasamu** adalah sistem manajemen bisnis berbasis web yang dirancang khusus untuk bisnis jasa seperti event organizer. Aplikasi ini membantu mengelola:

- 👥 **Manajemen Klien** - Data pelanggan/customer
- 🎵 **Manajemen Layanan** - Katalog jasa yang ditawarkan
- 📅 **Booking & Jadwal** - Pemesanan dan penjadwalan event
- 💰 **Pembayaran** - Tracking pembayaran dan cicilan
- 📊 **Laporan Keuangan** - Dashboard dan laporan lengkap
- 📦 **Backup & Restore** - Export/import data dengan validasi
- 💸 **Manajemen Pengeluaran** - Tracking biaya operasional

---

## 🚀 Teknologi

### Frontend
- **React 18.2.0** - UI Framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client
- **Chart.js** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Multer** - File upload

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Web server (production)

---

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder `docs/`:

### 🎯 Quick Links

- 📖 **[Dokumentasi Lengkap](docs/INDEX.md)** - Index semua dokumentasi
- 🚀 **[Instalasi](docs/setup/INSTALLATION.md)** - Panduan setup project
- 🔐 **[Authentication](docs/security/AUTHENTICATION_GUIDE.md)** - Security & auth
- ✨ **[Features](docs/features/)** - Dokumentasi fitur-fitur
- 🔧 **[Development](docs/development/QUICK_REFERENCE.md)** - Development guide

### ⭐ Dokumentasi Unggulan

- **[Backup & Restore Documentation](docs/features/BACKUP_RESTORE_DOCUMENTATION.md)**
  - 15,000+ kata dengan diagram lengkap
  - Complete workflow & troubleshooting
  - API reference & use cases

---

## 📥 Instalasi

### Prerequisites

**Opsi 1: Menggunakan Docker (Recommended)** 🐳
- Docker Desktop
- Docker Compose

**Opsi 2: Manual Installation**
- Node.js >= 16.x
- PostgreSQL >= 13.x
- npm atau yarn

### Quick Start dengan Docker 🐳

```bash
# Clone repository
git clone <repository-url>
cd CatatJasamu

# Opsi 1: Menggunakan Setup Script (Interactive)
./scripts/docker/docker-setup.sh

# Opsi 2: Menggunakan Makefile (Recommended)
make up       # Production
make dev      # Development
make logs     # Lihat logs
make help     # Lihat semua commands

# Opsi 3: Docker Compose Manual
docker-compose up -d                        # Production
docker-compose -f docker-compose.dev.yml up -d  # Development
```

Akses aplikasi:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **PostgreSQL**: localhost:5432

### Quick Start Manual

```bash
# Clone repository
git clone <repository-url>
cd CatatJasamu

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Setup database
# 1. Buat database PostgreSQL
# 2. Copy .env.example ke .env
# 3. Konfigurasi database di .env

# Jalankan migrasi
cd backend
npm run migrate

# Run development server
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Untuk detail lengkap:
- **Docker**: Lihat [DOCKER_SETUP.md](docs/setup/DOCKER_SETUP.md)
- **Quick Reference**: Lihat [DOCKER_QUICK_REFERENCE.md](docs/setup/DOCKER_QUICK_REFERENCE.md)
- **Manual**: Lihat [Panduan Instalasi](docs/setup/INSTALLATION.md)

---

## 🏗️ Struktur Project

```
CatatJasamu/
├── backend/           # Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/    # Konfigurasi
│   │   ├── controllers/  # Business logic
│   │   ├── middlewares/  # Auth & validation
│   │   ├── models/    # Database models
│   │   ├── routes/    # API routes
│   │   └── utils/     # Helper functions
│   ├── migrations/    # Database migrations
│   └── seeders/       # Database seeders
│
├── frontend/          # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/     # Page components
│   │   ├── services/  # API services
│   │   ├── context/   # React context
│   │   └── utils/     # Utilities
│   └── public/        # Static assets
│
└── docs/              # 📚 Dokumentasi lengkap
    ├── INDEX.md       # Index semua docs
    ├── architecture/  # Arsitektur sistem
    ├── setup/         # Instalasi & setup
    ├── security/      # Security docs
    ├── features/      # Feature docs
    ├── development/   # Dev guides
    └── api/           # API docs
```

---

## 🎨 Fitur Utama

### 1. 👥 Manajemen Klien
- CRUD data klien/customer
- Filter & search
- Export data

### 2. 🎵 Manajemen Layanan
- Katalog layanan dengan harga
- Kategori layanan
- Status active/inactive

### 3. 📅 Booking & Jadwal
- Booking multi-service
- Custom pricing per booking
- Status tracking (pending, confirmed, completed, cancelled)
- Calendar view

### 4. 💰 Sistem Pembayaran
- Multiple payment methods (cash, transfer, e-wallet)
- Down payment (DP) tracking
- Payment history
- Outstanding balance calculation

### 5. 📊 Dashboard & Laporan
- Revenue overview
- Booking statistics
- Expense tracking
- Charts & visualizations

### 6. 📦 Backup & Restore
- Export data to JSON
- Import with duplicate detection
- Preview before import
- Auto-selection untuk data relational
- Data integrity validation

### 7. 💸 Manajemen Pengeluaran
- Expense tracking dengan kategori
- Receipt upload
- Monthly/yearly reports
- Expense categories (custom & default)

### 8. 🔐 Security
- JWT authentication
- Role-based access control (Admin/User)
- PIN security untuk sensitive actions
- Password hashing dengan bcrypt

---

## 👥 User Roles

### Admin
- Full access ke semua fitur
- Manage users
- System settings
- View all data

### User
- Manage own data
- Limited access ke sensitive features
- Cannot access admin panel

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login
GET    /api/auth/profile     # Get profile
PUT    /api/auth/profile     # Update profile
```

### Clients
```
GET    /api/user/clients           # Get all clients
POST   /api/user/clients           # Create client
GET    /api/user/clients/:id       # Get client by ID
PUT    /api/user/clients/:id       # Update client
DELETE /api/user/clients/:id       # Delete client
```

### Services
```
GET    /api/user/services          # Get all services
POST   /api/user/services          # Create service
GET    /api/user/services/:id      # Get service by ID
PUT    /api/user/services/:id      # Update service
DELETE /api/user/services/:id      # Delete service
```

### Bookings
```
GET    /api/user/bookings          # Get all bookings
POST   /api/user/bookings          # Create booking
GET    /api/user/bookings/:id      # Get booking by ID
PUT    /api/user/bookings/:id      # Update booking
DELETE /api/user/bookings/:id      # Delete booking
```

### Backup & Restore
```
GET    /api/backup/download-json   # Export data
POST   /api/backup/import          # Import data
GET    /api/backup/current-data    # Get current data
```

Untuk detail lengkap, lihat [API Documentation](docs/api/API_OVERVIEW.md).

---

## 🛠️ Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Build Production

```bash
# Build frontend
cd frontend
npm run build

# Start backend production
cd backend
npm start
```

### Database Migrations

```bash
cd backend

# Run all migrations
npm run migrate

# Rollback last migration
npm run migrate:rollback

# Seed database
npm run seed
```

---

## 📖 Dokumentasi Developer

Untuk developer, silakan baca dokumentasi berikut:

1. **[Quick Reference](docs/development/QUICK_REFERENCE.md)** - Command & API quick ref
2. **[Database Schema](docs/architecture/DATABASE_SCHEMA.md)** - ER diagram & tables
3. **[Backend Fix Manual](docs/development/BACKEND_FIX_MANUAL.md)** - Troubleshooting
4. **[Migration Example](docs/development/MIGRATION_EXAMPLE.md)** - How to create migrations
5. **[Development Checklist](docs/development/CHECKLIST.md)** - Task tracking

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Check MySQL service, verify .env configuration

#### 2. Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution:** Kill process using port or change port in .env

#### 3. JWT Token Invalid
```bash
Error: jwt malformed
```
**Solution:** Clear browser storage, login again

Untuk masalah lainnya, lihat [Backend Fix Manual](docs/development/BACKEND_FIX_MANUAL.md).

---

## 🤝 Contributing

Kontribusi sangat diterima! Silakan ikuti langkah berikut:

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Guidelines

- Follow existing code style
- Write clear commit messages
- Add tests for new features
- Update documentation
- Check [CHECKLIST.md](docs/development/CHECKLIST.md)

---

## 📝 License

This project is licensed under the MIT License.

---

## 👤 Authors

- **Development Team** - CatatJasamu

---

## 📞 Support

- **Documentation:** [docs/](docs/)
- **Issues:** GitHub Issues
- **Email:** support@catatjasamu.com

---

## 🙏 Acknowledgments

- React Team
- Express.js Community
- Tailwind CSS
- All contributors

---

## 📅 Changelog

Lihat [CHANGELOG.md](docs/CHANGELOG.md) untuk daftar perubahan per versi.

---

## 🎯 Roadmap

### Version 2.0 (Planned)

- [ ] WhatsApp integration untuk notifikasi
- [ ] Email reminders untuk event
- [ ] Invoice generator PDF
- [ ] Multi-currency support
- [ ] Advanced reporting dengan filters
- [ ] Mobile app (React Native)
- [ ] Payment gateway integration
- [ ] Client portal

---

**Version:** 1.0.0  
**Last Updated:** November 2025

---

> 💡 **Tip:** Baca [docs/INDEX.md](docs/INDEX.md) untuk navigasi lengkap semua dokumentasi!
