# Dokumentasi Struktur File & Folder

## ✅ Struktur Sudah Dibuat

### Frontend Structure

```
frontend/
├── public/
│   └── (logo, favicon - to be added)
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── Admin/              ✅ Created
│   │   ├── User/               ✅ Created
│   │   ├── Layout/             ✅ Created
│   │   │   ├── AdminLayout.jsx ✅ Created
│   │   │   ├── UserLayout.jsx  ✅ Created
│   │   │   ├── AdminSidebar.jsx (To be created)
│   │   │   ├── UserSidebar.jsx  (To be created)
│   │   │   ├── AdminNavbar.jsx  (To be created)
│   │   │   └── UserNavbar.jsx   (To be created)
│   │   ├── Auth/               ✅ Created
│   │   │   ├── ProtectedRoute.jsx ✅ Created
│   │   │   └── RoleBasedRoute.jsx ✅ Created
│   │   └── Common/             ✅ Created
│   │
│   ├── pages/
│   │   ├── Admin/              ✅ Created
│   │   │   ├── Dashboard.jsx (To be created)
│   │   │   ├── Clients/
│   │   │   ├── Services/
│   │   │   ├── Transactions/
│   │   │   ├── Reports/
│   │   │   ├── Users/
│   │   │   └── Settings.jsx
│   │   ├── User/               ✅ Created
│   │   │   ├── Dashboard.jsx (To be created)
│   │   │   ├── Profile.jsx
│   │   │   ├── Transactions/
│   │   │   ├── Appointments.jsx
│   │   │   └── Settings.jsx
│   │   └── Auth/               ✅ Created
│   │       ├── Login.jsx (To be created)
│   │       ├── Register.jsx (To be created)
│   │       └── ForgotPassword.jsx
│   │
│   ├── services/
│   │   ├── api.js              ✅ Created
│   │   ├── authService.js      ✅ Created
│   │   ├── clientService.js    ✅ Created
│   │   ├── admin/              ✅ Created
│   │   │   └── clientService.js ✅ Created
│   │   └── user/               ✅ Created
│   │       ├── profileService.js ✅ Created
│   │       └── transactionService.js ✅ Created
│   │
│   ├── hooks/                  ✅ Created
│   ├── context/                ✅ Created
│   ├── utils/                  ✅ Created
│   │   ├── format.js           ✅ Created
│   │   ├── validation.js       ✅ Created
│   │   └── constants.js        ✅ Created
│   │
│   ├── styles/
│   │   └── index.css           ✅ Created
│   │
│   ├── App.jsx                 ✅ Updated with role-based routing
│   └── main.jsx                ✅ Created
│
├── .env.example                ✅ Created
├── .gitignore                  ✅ Created (root level)
├── index.html                  ✅ Created
├── package.json                ✅ Created
├── vite.config.js              ✅ Created
├── tailwind.config.js          ✅ Created
├── postcss.config.js           ✅ Created
└── README.md                   ✅ Created
```

### Backend Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js         ✅ Created
│   │
│   ├── models/                 ✅ Created
│   │   ├── User.js            ✅ Created
│   │   ├── Client.js          ✅ Created
│   │   ├── Service.js         ✅ Created
│   │   ├── Transaction.js     ✅ Created
│   │   └── index.js           ✅ Created (with associations)
│   │
│   ├── controllers/
│   │   ├── admin/             ✅ Created
│   │   └── user/              ✅ Created
│   │
│   ├── routes/
│   │   ├── authRoutes.js      ✅ Created
│   │   ├── clientRoutes.js    ✅ Created
│   │   ├── serviceRoutes.js   ✅ Created
│   │   ├── transactionRoutes.js ✅ Created
│   │   ├── reportRoutes.js    ✅ Created
│   │   ├── userRoutes.js      ✅ Created
│   │   ├── admin/             ✅ Created
│   │   └── user/              ✅ Created
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js  ✅ Created
│   │   ├── roleMiddleware.js  ✅ Created
│   │   └── validateMiddleware.js ✅ Created
│   │
│   ├── utils/
│   │   ├── apiResponse.js     ✅ Created
│   │   └── jwtHelper.js       ✅ Created
│   │
│   ├── migrations/            ✅ Created
│   ├── seeders/               ✅ Created
│   └── server.js              ✅ Created
│
├── .env.example               ✅ Created
├── .sequelizerc               ✅ Created
├── package.json               ✅ Created
└── README.md                  ✅ Created
```

---

## 🎯 Perbedaan Admin vs User

### **ADMIN (Pemilik Aplikasi)**

**URL Pattern:** `/admin/*`

**Fitur:**
1. **Dashboard Lengkap**
   - Total revenue
   - Total clients
   - Total transactions
   - Charts & analytics

2. **Manajemen Klien**
   - Lihat semua klien
   - Tambah klien baru
   - Edit data klien
   - Hapus klien
   - View detail & history

3. **Manajemen Layanan**
   - Lihat semua layanan
   - Tambah layanan baru
   - Edit layanan
   - Hapus layanan
   - Set harga & durasi

4. **Manajemen Transaksi**
   - Lihat semua transaksi
   - Tambah transaksi baru
   - Edit transaksi
   - Ubah status transaksi
   - View detail transaksi

5. **Laporan & Analitik**
   - Laporan pendapatan
   - Laporan klien
   - Laporan layanan
   - Export ke PDF/Excel

6. **Manajemen User**
   - Lihat semua user
   - Kelola akses user

7. **Pengaturan**
   - Pengaturan aplikasi
   - Profil admin
   - Ganti password

**Akses Data:** SEMUA data dalam sistem

---

### **USER (Pelanggan/Klien)**

**URL Pattern:** `/user/*`

**Fitur:**
1. **Dashboard Sederhana**
   - Total transaksi pribadi
   - Total spending
   - Status pembayaran

2. **Profil**
   - Lihat profil pribadi
   - Edit informasi kontak
   - Ganti password

3. **Riwayat Transaksi**
   - Lihat riwayat transaksi sendiri
   - View detail transaksi
   - Status pembayaran

4. **Appointments (opsional)**
   - Lihat jadwal appointment
   - Status appointment

5. **Notifikasi**
   - Notifikasi transaksi baru
   - Notifikasi appointment

6. **Pengaturan**
   - Pengaturan akun
   - Privacy settings

**Akses Data:** HANYA data milik sendiri

---

## 🔐 Sistem Authentication & Authorization

### 1. **Register & Login**
```
User/Admin → Input credentials → Backend validate
                                      ↓
                              Check credentials
                                      ↓
                              Generate JWT token
                                      ↓
                              Include user data (id, name, email, role)
                                      ↓
                              Return to Frontend
                                      ↓
                              Store in localStorage
```

### 2. **Role-Based Access Control**
```
Every Request → Include JWT token in header
                        ↓
                Backend validate token
                        ↓
                Extract user data (including role)
                        ↓
        Check if user has permission for this route
                        ↓
        ┌───────────────┴───────────────┐
        │                               │
    role = 'admin'                  role = 'user'
        │                               │
    Allow admin routes              Allow user routes
    Access all data                 Access own data only
```

### 3. **Frontend Route Protection**

**ProtectedRoute Component:**
- Check if user is logged in
- If not → Redirect to `/login`
- If yes → Allow access

**RoleBasedRoute Component:**
- Check if user has correct role
- Admin trying to access user route → Redirect to `/admin/dashboard`
- User trying to access admin route → Redirect to `/user/dashboard`

### 4. **Backend Middleware Chain**

```javascript
// Admin route example
router.get('/admin/clients', 
  authMiddleware,        // Check if logged in
  isAdmin,               // Check if role = 'admin'
  clientController.getAll
)

// User route example
router.get('/user/transactions',
  authMiddleware,        // Check if logged in
  isUser,                // Check if role = 'user'
  transactionController.getMyTransactions  // Only return user's data
)
```

---

## 📊 Database Schema

### **users** table
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
email           VARCHAR(100) UNIQUE NOT NULL
password        VARCHAR(255) NOT NULL (hashed)
role            ENUM('admin', 'user') DEFAULT 'user'
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### **clients** table
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
email           VARCHAR(100)
phone           VARCHAR(20) NOT NULL
address         TEXT
notes           TEXT
user_id         INTEGER REFERENCES users(id)  -- Admin who created
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### **services** table
```sql
id              SERIAL PRIMARY KEY
name            VARCHAR(100) NOT NULL
description     TEXT
price           DECIMAL(10,2) NOT NULL
duration        INTEGER  -- in minutes
user_id         INTEGER REFERENCES users(id)  -- Admin who created
is_active       BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### **transactions** table
```sql
id              SERIAL PRIMARY KEY
client_id       INTEGER REFERENCES clients(id)
service_id      INTEGER REFERENCES services(id)
user_id         INTEGER REFERENCES users(id)  -- Admin who recorded
amount          DECIMAL(10,2) NOT NULL
date            TIMESTAMP
status          ENUM('pending', 'completed', 'cancelled')
payment_method  ENUM('cash', 'transfer', 'e-wallet', 'other')
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🚀 Next Steps untuk Development

### Phase 1: Setup & Authentication ⏳
1. Install dependencies (frontend & backend)
2. Setup database PostgreSQL
3. Buat halaman Login & Register
4. Implementasi authentication backend (JWT)
5. Test login flow untuk admin & user

### Phase 2: Admin Dashboard & Layout ⏳
1. Buat AdminSidebar & AdminNavbar component
2. Buat Admin Dashboard dengan statistics
3. Setup charts library (recharts/chart.js)
4. Buat common components (Button, Input, Card, etc)

### Phase 3: Admin - Client Management ⏳
1. Buat halaman Client List
2. Buat form Add Client
3. Buat halaman Client Detail
4. Buat form Edit Client
5. Implement delete functionality
6. Backend controllers & routes untuk clients

### Phase 4: Admin - Service Management ⏳
1. Buat halaman Service List
2. Buat form Add/Edit Service
3. Backend controllers & routes untuk services

### Phase 5: Admin - Transaction Management ⏳
1. Buat halaman Transaction List
2. Buat form Add Transaction
3. Buat halaman Transaction Detail
4. Backend controllers & routes untuk transactions

### Phase 6: Admin - Reports & Analytics ⏳
1. Buat halaman Reports
2. Implement revenue chart
3. Implement client statistics
4. Export functionality (PDF/Excel)

### Phase 7: User Dashboard & Features ⏳
1. Buat UserSidebar & UserNavbar component
2. Buat User Dashboard
3. Buat User Profile page
4. Buat Transaction History page
5. Backend controllers untuk user routes

### Phase 8: Testing & Deployment ⏳
1. Testing semua fitur
2. Fix bugs
3. Optimization
4. Deployment setup

---

## 📝 Catatan Penting

1. **Role 'admin'** = Pemilik aplikasi, full control
2. **Role 'user'** = Klien/pelanggan, limited access
3. Semua route dilindungi dengan authentication
4. Admin tidak bisa mengakses user route dan sebaliknya
5. User hanya bisa melihat data transaksi mereka sendiri
6. Admin bisa melihat semua data

---

**Status:** ✅ Struktur folder sudah siap!
**Siap untuk:** Development Phase 1 - Authentication

**Tunggu instruksi selanjutnya! 🎉**
