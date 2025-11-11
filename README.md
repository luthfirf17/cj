<div align="center">

# 🎯 CatatJasamu

### Sistem Manajemen Bisnis Modern untuk Event Organizer

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

<p align="center">
  <strong>Aplikasi web lengkap untuk mengelola bisnis jasa</strong><br>
  Klien • Layanan • Booking • Pembayaran • Laporan Keuangan
</p>

[📖 Dokumentasi](#-dokumentasi) • [🚀 Quick Start](#-quick-start) • [✨ Fitur](#-fitur-utama) • [🛠️ Teknologi](#️-teknologi)

</div>

---

## 📋 Tentang Project

**CatatJasamu** adalah sistem manajemen bisnis berbasis web yang dirancang khusus untuk bisnis jasa seperti event organizer, sound system rental, wedding organizer, dan jasa lainnya. Aplikasi ini menyediakan solusi lengkap untuk mengelola operasional bisnis dari A sampai Z.

### 🎯 Problem Yang Diselesaikan

- ❌ Pencatatan manual yang rawan error
- ❌ Sulit tracking pembayaran client
- ❌ Tidak ada sistem backup data
- ❌ Laporan keuangan tidak terstruktur
- ❌ Manajemen jadwal yang kacau

### ✅ Solusi CatatJasamu

- ✨ Dashboard interaktif dengan visualisasi data
- ✨ Sistem booking otomatis dengan validasi
- ✨ Tracking pembayaran real-time
- ✨ Export/Import data dengan deteksi duplikat
- ✨ Laporan keuangan komprehensif
- ✨ Multi-user dengan role-based access

---

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 👤 User Dashboard
- 📊 Overview statistik bisnis
- � Kalender booking interaktif
- 💰 Tracking pembayaran & invoice
- 📈 Grafik pendapatan & pengeluaran
- � Search & filter advanced

</td>
<td width="50%">

### 🔐 Admin Panel
- 👥 User management
- ⚙️ System settings
- 📊 Analytics dashboard
- 🔒 Security PIN system
- 🗄️ Database management

</td>
</tr>
<tr>
<td width="50%">

### 💼 Manajemen Bisnis
- **Clients**: CRUD clients dengan detail lengkap
- **Services**: Katalog layanan dengan pricing
- **Bookings**: Multi-day booking dengan custom pricing
- **Payments**: Cicilan, diskon, pajak, biaya tambahan
- **Expenses**: Tracking pengeluaran per kategori

</td>
<td width="50%">

### 🎨 UX/UI Features
- 🌓 Dark/Light mode (optional)
- 📱 Responsive design
- 🎨 Modern Tailwind UI
- 🔔 Real-time notifications
- 📥 Export ke Excel
- 🔄 Auto-save forms

</td>
</tr>
</table>

---

## �️ Teknologi

### Frontend Stack
```
React 18.2.0      →  Modern UI Framework
Vite              →  Lightning fast build tool
Tailwind CSS      →  Utility-first CSS framework
React Router v6   →  Client-side routing
Axios             →  HTTP requests
Chart.js          →  Data visualization
date-fns          →  Date utilities
```

### Backend Stack
```
Node.js + Express →  REST API server
PostgreSQL 15     →  Relational database
JWT               →  Secure authentication
bcrypt            →  Password hashing
pg                →  PostgreSQL client
dotenv            →  Environment variables
```

### DevOps & Tools
```
Docker            →  Containerization
Docker Compose    →  Multi-container orchestration
Nginx             →  Production web server
Git               →  Version control
```

---

### 📦 Prerequisites

Pastikan sudah terinstall:
- 🐳 **Docker** & **Docker Compose** ([Install Docker](https://docs.docker.com/get-docker/))
- 📦 **Node.js** 18+ ([Download](https://nodejs.org/))
- 🗄️ **PostgreSQL** 15+ (opsional, bisa pakai Docker)
- 🔧 **Git** ([Download](https://git-scm.com/downloads))

### 🚀 Instalasi Cepat (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/luthfirf17/cj.git
cd cj

# 2. Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Jalankan dengan Docker
docker-compose up -d

# 4. Akses aplikasi
# Frontend: http://localhost:3000
# Backend:  http://localhost:5001
```

🎉 **Done!** Aplikasi sudah running!

### 🔐 Default Admin Login

```
Email:    admin@cataljasamu.com
Password: admin123
PIN:      000000
```

⚠️ **PENTING**: Ganti password & PIN setelah login pertama kali!

---

## 📸 Screenshots

<details>
<summary>🖼️ Klik untuk lihat screenshots</summary>

### User Dashboard
![User Dashboard](https://via.placeholder.com/800x450?text=User+Dashboard+Screenshot)

### Booking Management
![Booking](https://via.placeholder.com/800x450?text=Booking+Management+Screenshot)

### Financial Reports
![Reports](https://via.placeholder.com/800x450?text=Financial+Reports+Screenshot)

### Admin Panel
![Admin](https://via.placeholder.com/800x450?text=Admin+Panel+Screenshot)

</details>

---

## 🏗️ Struktur Project

```
CatatJasamu/
├── 📂 backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/          # Database config
│   │   ├── controllers/     # Business logic
│   │   ├── middlewares/     # Auth, validation
│   │   ├── routes/          # API routes
│   │   └── server.js        # Entry point
│   ├── migrations/          # DB migrations
│   └── Dockerfile
│
├── 📂 frontend/             # React + Vite app
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── utils/           # Helper functions
│   │   └── App.jsx
│   ├── public/              # Static assets
│   └── Dockerfile
│
├── 📂 docs/                 # 📚 Dokumentasi lengkap
│   ├── api/                 # API documentation
│   ├── architecture/        # System design
│   ├── features/            # Feature docs
│   ├── security/            # Security guides
│   └── setup/               # Installation guides
│
├── 📂 scripts/              # Automation scripts
│   ├── backup/              # Backup utilities
│   ├── restore/             # Restore utilities
│   └── docker/              # Docker helpers
│
├── 🐳 docker-compose.yml    # Docker orchestration
├── 📝 README.md             # You are here
└── 📄 .gitignore
```

---

## 📚 Dokumentasi

### 🎯 Quick Links
- 📖 **[Dokumentasi Lengkap](docs/INDEX.md)** - Index semua dokumentasi
- 🚀 **[Quick Start Guide](docs/setup/QUICK_START.md)** - Mulai dalam 5 menit
- 🔧 **[Installation Guide](docs/setup/INSTALLATION.md)** - Panduan setup lengkap
- 🐳 **[Docker Setup](docs/setup/DOCKER_SETUP.md)** - Deploy dengan Docker
- 🔐 **[Authentication Guide](docs/security/AUTHENTICATION_GUIDE.md)** - Security & auth

### ⭐ Feature Documentation
- 💾 **[Backup & Restore](docs/features/BACKUP_RESTORE_DOCUMENTATION.md)** - Export/Import data (15,000+ kata!)
- 🔒 **[PIN Security](docs/security/PIN_SECURITY_IMPLEMENTATION_SUMMARY.md)** - Security PIN system
- 🏢 **[Admin System](docs/features/ADMIN_SYSTEM_DOCUMENTATION.md)** - Admin panel guide
- 💰 **[Financial Page](docs/features/FINANCIAL_PAGE_README.md)** - Laporan keuangan
- � **[Excel Export](docs/features/EXCEL_EXPORT_IMPROVEMENTS.md)** - Export improvements

### 🔨 Development
- 🛠️ **[Quick Reference](docs/development/QUICK_REFERENCE.md)** - Cheat sheet development
- 🗄️ **[Database Schema](docs/architecture/DATABASE_SCHEMA.md)** - ERD & schema lengkap
- 🏗️ **[Architecture](docs/architecture/STRUKTUR_APLIKASI.md)** - System architecture

---

## 🔧 Development

### Manual Setup (Without Docker)

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env dengan database config Anda
npm run migrate  # Run migrations
npm run dev      # Start dev server

# Frontend setup (terminal baru)
cd frontend
npm install
cp .env.example .env
npm run dev      # Start dev server
```

### Available Scripts

```bash
# Backend
npm run dev      # Start development server
npm run start    # Start production server
npm run migrate  # Run database migrations

# Frontend  
npm run dev      # Start dev server dengan HMR
npm run build    # Build untuk production
npm run preview  # Preview production build

# Docker
docker-compose up -d           # Start semua services
docker-compose down            # Stop semua services
docker-compose logs -f         # View logs
docker-compose restart frontend # Restart specific service
```

---

## 🔑 Environment Variables

### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=catat_jasamu_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=7d

# Server
PORT=5001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5001
VITE_APP_NAME=CatatJasamu
```

---

## 🤝 Contributing

Contributions are welcome! Berikut cara berkontribusi:

1. 🍴 Fork repository ini
2. 🌿 Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. ✍️ Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push ke branch (`git push origin feature/AmazingFeature`)
5. 🔃 Buat Pull Request

### 📋 Contribution Guidelines

- Gunakan conventional commits
- Tambahkan tests untuk fitur baru
- Update dokumentasi jika diperlukan
- Follow existing code style

---

## 🤝 Contributing

Contributions are welcome! Berikut cara berkontribusi:

1. 🍴 Fork repository ini
2. 🌿 Buat branch fitur (`git checkout -b feature/AmazingFeature`)
3. ✍️ Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. 📤 Push ke branch (`git push origin feature/AmazingFeature`)
5. 🔃 Buat Pull Request

### 📋 Contribution Guidelines

- Gunakan conventional commits
- Tambahkan tests untuk fitur baru
- Update dokumentasi jika diperlukan
- Follow existing code style

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

Copyright © 2025 **Cep Luthfi Rizky Fauzi**

---

## 👨‍💻 Author

<table>
<tr>
<td align="center">
<img src="https://github.com/luthfirf17.png" width="100px;" alt="Cep Luthfi Rizky Fauzi"/><br />
<sub><b>Cep Luthfi Rizky Fauzi</b></sub><br />
<sub>Creator & Developer</sub>
</td>
</tr>
</table>

**Contact Information:**
- 📧 Email: [catatjasamu@gmail.com](mailto:catatjasamu@gmail.com)
- 🐙 GitHub: [@luthfirf17](https://github.com/luthfirf17)
- 📍 Location: Tasikmalaya, Jawa Barat, Indonesia
- 🏢 Repository: [github.com/luthfirf17/cj](https://github.com/luthfirf17/cj)

---

## 🙏 Acknowledgments

- React Team untuk framework yang luar biasa
- Tailwind CSS untuk utility-first CSS
- PostgreSQL untuk database yang powerful
- Docker untuk containerization yang mudah

---

## � Support

Butuh bantuan? 

- 📖 Baca [Dokumentasi Lengkap](docs/INDEX.md)
- 🐛 [Report Bug](https://github.com/luthfirf17/cj/issues)
- 💡 [Request Feature](https://github.com/luthfirf17/cj/issues)

---

<div align="center">

**⭐ Jangan lupa beri star jika project ini membantu! ⭐**

Made with ❤️ by [Luthfi RF](https://github.com/luthfirf17)

</div>

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
