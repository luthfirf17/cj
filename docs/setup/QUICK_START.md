# Catat Jasamu - Quick Start Guide

## 🎯 Ringkasan Proyek

**Catat Jasamu** adalah aplikasi web untuk mengelola data klien dan transaksi jasa dengan 2 tipe pengguna:

- **👨‍💼 ADMIN**: Pemilik bisnis dengan akses penuh
- **👤 USER**: Klien/pelanggan dengan akses terbatas

---

## 📁 Struktur Proyek (Sudah Dibuat ✅)

```
CatatJasamu/
│
├── frontend/                    # React.js App
│   ├── src/
│   │   ├── components/
│   │   │   ├── Admin/          ✅ Komponen khusus admin
│   │   │   ├── User/           ✅ Komponen khusus user
│   │   │   ├── Layout/         ✅ Layout components
│   │   │   ├── Auth/           ✅ Auth components
│   │   │   └── Common/         ✅ Shared components
│   │   ├── pages/
│   │   │   ├── Admin/          ✅ Halaman admin
│   │   │   ├── User/           ✅ Halaman user
│   │   │   └── Auth/           ✅ Halaman auth
│   │   ├── services/
│   │   │   ├── admin/          ✅ Admin API services
│   │   │   └── user/           ✅ User API services
│   │   └── utils/              ✅ Helper functions
│   └── ...config files
│
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── models/             ✅ Database models
│   │   ├── controllers/
│   │   │   ├── admin/          ✅ Admin controllers
│   │   │   └── user/           ✅ User controllers
│   │   ├── routes/
│   │   │   ├── admin/          ✅ Admin routes
│   │   │   └── user/           ✅ User routes
│   │   ├── middlewares/        ✅ Auth & role middleware
│   │   └── ...
│   └── ...config files
│
├── Referensi/                   # Screenshot UI/UX
├── STRUKTUR_APLIKASI.md        ✅ Dokumentasi lengkap
├── DOKUMENTASI_STRUKTUR.md     ✅ Detail struktur
└── README.md                    ✅ Project overview
```

---

## 🔑 Perbedaan Admin vs User

### ADMIN (/admin/*)
```
✅ Dashboard dengan analytics
✅ CRUD Klien (semua data)
✅ CRUD Layanan
✅ CRUD Transaksi (semua data)
✅ Laporan & Export
✅ Manajemen User
✅ Full Access
```

### USER (/user/*)
```
✅ Dashboard sederhana
✅ View & Edit Profil sendiri
✅ View Transaksi sendiri saja
✅ Status Pembayaran
✅ Limited Access
```

---

## 🚀 Setup Proyek

### 1. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env sesuai kebutuhan
npm run dev
```

**Frontend akan berjalan di:** `http://localhost:3000`

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env dengan konfigurasi database
```

**Edit `.env` backend:**
```env
DB_NAME=catat_jasamu_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

**Buat database:**
```bash
# Masuk ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE catat_jasamu_db;
\q
```

**Jalankan server:**
```bash
npm run dev
```

**Backend akan berjalan di:** `http://localhost:5000`

---

## 🗂️ Database Tables

### users
- User/Admin dengan role

### clients
- Data klien/pelanggan
- Dibuat oleh admin

### services
- Layanan/jasa yang ditawarkan
- Dibuat oleh admin

### transactions
- Transaksi antara client & service
- Dicatat oleh admin

---

## 🛣️ Routes

### Public Routes
- `/` → Redirect to login
- `/login` → Login page
- `/register` → Register page

### Admin Routes (Protected)
- `/admin/dashboard` → Admin dashboard
- `/admin/clients` → Client management
- `/admin/services` → Service management
- `/admin/transactions` → Transaction management
- `/admin/reports` → Reports & analytics
- `/admin/users` → User management
- `/admin/settings` → Settings

### User Routes (Protected)
- `/user/dashboard` → User dashboard
- `/user/profile` → User profile
- `/user/transactions` → Transaction history
- `/user/settings` → User settings

---

## 🔐 Authentication Flow

```
1. User/Admin → Login dengan email & password
2. Backend → Validate credentials
3. Backend → Generate JWT token (include role)
4. Frontend → Store token di localStorage
5. Every request → Send token in Authorization header
6. Backend → Validate token & check role
7. Backend → Return data sesuai permission
```

---

## 📦 Tech Stack

### Frontend
- React 18
- Vite
- React Router v6
- Tailwind CSS
- Axios
- Formik + Yup
- React Toastify
- React Icons

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT
- bcryptjs
- helmet & cors

---

## 📋 Next Steps

Saat ini struktur folder sudah siap! Berikut langkah selanjutnya:

### ⏳ Phase 1: Authentication
1. Buat halaman Login
2. Buat halaman Register
3. Implementasi JWT authentication
4. Test login untuk admin & user

### ⏳ Phase 2: Admin Layout
1. Buat Sidebar & Navbar
2. Buat Dashboard dengan stats
3. Buat common components

### ⏳ Phase 3: Admin Features
1. Client Management
2. Service Management
3. Transaction Management
4. Reports

### ⏳ Phase 4: User Features
1. User Dashboard
2. Profile Management
3. Transaction History

---

## 📞 Siap Development?

**Struktur sudah siap! ✅**

Tunggu instruksi selanjutnya untuk mulai implementasi fitur.

---

**Happy Coding! 🎉**
