# Struktur Aplikasi Catat Jasamu

## Konsep Aplikasi

Aplikasi **Catat Jasamu** memiliki 2 jenis pengguna dengan tampilan dan fitur yang berbeda:

### 1. **ADMIN** (Pemilik Aplikasi)
Admin adalah pemilik bisnis/jasa yang memiliki kontrol penuh atas sistem.

**Fitur Admin:**
- ✅ Dashboard lengkap dengan statistik dan analytics
- ✅ Manajemen Klien (CRUD - Create, Read, Update, Delete)
- ✅ Manajemen Layanan/Jasa (CRUD)
- ✅ Manajemen Transaksi
- ✅ Laporan dan Analitik (Revenue, Client Stats, Service Performance)
- ✅ Manajemen User/Pegawai
- ✅ Pengaturan Aplikasi (Settings)
- ✅ Export data (PDF, Excel)
- ✅ Notifikasi dan reminder

**Akses Admin:**
- Route: `/admin/*`
- Dashboard: `/admin/dashboard`
- Full access ke semua data

---

### 2. **USER** (Pengguna/Klien)
User adalah klien/pelanggan yang menggunakan jasa dan dapat melihat riwayat transaksi mereka.

**Fitur User:**
- ✅ Profil pribadi
- ✅ Riwayat transaksi/layanan yang digunakan
- ✅ Status pembayaran
- ✅ Jadwal appointment (jika ada)
- ✅ Notifikasi
- ✅ Update informasi kontak

**Akses User:**
- Route: `/user/*`
- Dashboard: `/user/dashboard`
- Limited access - hanya data diri sendiri

---

## Struktur Folder Frontend

```
frontend/
├── public/
│   ├── logo.svg
│   └── favicon.ico
│
├── src/
│   ├── assets/
│   │   ├── images/           # Gambar-gambar
│   │   │   ├── admin/        # Gambar khusus admin
│   │   │   ├── user/         # Gambar khusus user
│   │   │   └── common/       # Gambar umum
│   │   └── icons/            # Icon-icon
│   │
│   ├── components/
│   │   ├── Admin/            # Komponen khusus Admin
│   │   │   ├── Dashboard/
│   │   │   │   ├── StatCard.jsx
│   │   │   │   ├── RevenueChart.jsx
│   │   │   │   └── RecentTransactions.jsx
│   │   │   ├── Client/
│   │   │   │   ├── ClientTable.jsx
│   │   │   │   ├── ClientForm.jsx
│   │   │   │   └── ClientCard.jsx
│   │   │   ├── Service/
│   │   │   │   ├── ServiceTable.jsx
│   │   │   │   └── ServiceForm.jsx
│   │   │   └── Transaction/
│   │   │       ├── TransactionTable.jsx
│   │   │       └── TransactionForm.jsx
│   │   │
│   │   ├── User/             # Komponen khusus User
│   │   │   ├── Dashboard/
│   │   │   │   ├── ProfileCard.jsx
│   │   │   │   └── TransactionHistory.jsx
│   │   │   ├── Profile/
│   │   │   │   └── ProfileForm.jsx
│   │   │   └── Transaction/
│   │   │       └── TransactionCard.jsx
│   │   │
│   │   ├── Layout/           # Layout components
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── UserLayout.jsx
│   │   │   ├── AdminSidebar.jsx
│   │   │   ├── UserSidebar.jsx
│   │   │   ├── AdminNavbar.jsx
│   │   │   └── UserNavbar.jsx
│   │   │
│   │   ├── Auth/             # Authentication components
│   │   │   ├── LoginForm.jsx
│   │   │   ├── RegisterForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── RoleBasedRoute.jsx
│   │   │
│   │   └── Common/           # Komponen umum (dipakai admin & user)
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Table.jsx
│   │       ├── Card.jsx
│   │       ├── Badge.jsx
│   │       ├── Spinner.jsx
│   │       └── Pagination.jsx
│   │
│   ├── pages/
│   │   ├── Admin/            # Halaman Admin
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients/
│   │   │   │   ├── ClientList.jsx
│   │   │   │   ├── ClientDetail.jsx
│   │   │   │   ├── AddClient.jsx
│   │   │   │   └── EditClient.jsx
│   │   │   ├── Services/
│   │   │   │   ├── ServiceList.jsx
│   │   │   │   ├── AddService.jsx
│   │   │   │   └── EditService.jsx
│   │   │   ├── Transactions/
│   │   │   │   ├── TransactionList.jsx
│   │   │   │   ├── TransactionDetail.jsx
│   │   │   │   └── AddTransaction.jsx
│   │   │   ├── Reports/
│   │   │   │   ├── RevenueReport.jsx
│   │   │   │   ├── ClientReport.jsx
│   │   │   │   └── ServiceReport.jsx
│   │   │   ├── Users/
│   │   │   │   ├── UserList.jsx
│   │   │   │   └── UserDetail.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── User/             # Halaman User
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Transactions/
│   │   │   │   ├── TransactionHistory.jsx
│   │   │   │   └── TransactionDetail.jsx
│   │   │   ├── Appointments.jsx
│   │   │   └── Settings.jsx
│   │   │
│   │   ├── Auth/             # Halaman Authentication
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   └── ForgotPassword.jsx
│   │   │
│   │   └── NotFound.jsx
│   │
│   ├── services/             # API Services
│   │   ├── api.js            # Axios instance
│   │   ├── authService.js    # Auth API
│   │   ├── admin/            # Admin services
│   │   │   ├── clientService.js
│   │   │   ├── serviceService.js
│   │   │   ├── transactionService.js
│   │   │   └── reportService.js
│   │   └── user/             # User services
│   │       ├── profileService.js
│   │       └── transactionService.js
│   │
│   ├── hooks/                # Custom React Hooks
│   │   ├── useAuth.js
│   │   ├── useClient.js
│   │   ├── useService.js
│   │   └── useTransaction.js
│   │
│   ├── context/              # React Context
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   │
│   ├── utils/                # Utility functions
│   │   ├── format.js         # Format currency, date, etc
│   │   ├── validation.js     # Form validation schemas
│   │   └── constants.js      # App constants
│   │
│   ├── styles/               # Global styles
│   │   └── index.css
│   │
│   ├── App.jsx               # Root component dengan routing
│   └── main.jsx              # Entry point
│
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Struktur Folder Backend

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # Database configuration
│   │   └── config.js         # App configuration
│   │
│   ├── models/               # Database Models (Sequelize)
│   │   ├── User.js           # Model User (admin & user)
│   │   ├── Client.js         # Model Client/Pelanggan
│   │   ├── Service.js        # Model Layanan/Jasa
│   │   ├── Transaction.js    # Model Transaksi
│   │   └── index.js          # Model associations
│   │
│   ├── controllers/
│   │   ├── authController.js # Authentication
│   │   ├── admin/            # Controllers untuk Admin
│   │   │   ├── clientController.js
│   │   │   ├── serviceController.js
│   │   │   ├── transactionController.js
│   │   │   ├── reportController.js
│   │   │   └── userController.js
│   │   └── user/             # Controllers untuk User
│   │       ├── profileController.js
│   │       └── transactionController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js     # Auth routes (login, register)
│   │   ├── admin/            # Admin routes
│   │   │   ├── clientRoutes.js
│   │   │   ├── serviceRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   └── userRoutes.js
│   │   └── user/             # User routes
│   │       ├── profileRoutes.js
│   │       └── transactionRoutes.js
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js     # Verify JWT token
│   │   ├── roleMiddleware.js     # Check user role (admin/user)
│   │   └── validateMiddleware.js # Input validation
│   │
│   ├── utils/
│   │   ├── apiResponse.js    # Standardized API response
│   │   ├── jwtHelper.js      # JWT utilities
│   │   └── errorHandler.js   # Error handling
│   │
│   ├── migrations/           # Database migrations
│   ├── seeders/              # Database seeders
│   │
│   └── server.js             # Entry point
│
├── .env.example
├── .gitignore
├── .sequelizerc
├── package.json
└── README.md
```

---

## Flow Aplikasi

### 1. Authentication Flow
```
User/Admin → Login → Backend validate → Generate JWT → Store token
                                                      ↓
                                            Check role (admin/user)
                                                      ↓
                                    Redirect to dashboard sesuai role
```

### 2. Admin Flow
```
Admin Dashboard → Pilih Menu (Clients/Services/Transactions)
       ↓
View/Create/Update/Delete Data
       ↓
Backend Process → Update Database → Return Response
       ↓
Update UI
```

### 3. User Flow
```
User Dashboard → View Profile/Transactions
       ↓
View Own Data Only
       ↓
Backend Filter by userId → Return User's Data Only
       ↓
Display in UI
```

---

## Routing Structure

### Frontend Routes

**Public Routes:**
- `/` - Landing page
- `/login` - Login page
- `/register` - Register page

**Admin Routes (Protected, role: admin):**
- `/admin/dashboard` - Admin dashboard
- `/admin/clients` - Client list
- `/admin/clients/:id` - Client detail
- `/admin/clients/add` - Add client
- `/admin/clients/:id/edit` - Edit client
- `/admin/services` - Service list
- `/admin/services/add` - Add service
- `/admin/services/:id/edit` - Edit service
- `/admin/transactions` - Transaction list
- `/admin/transactions/:id` - Transaction detail
- `/admin/transactions/add` - Add transaction
- `/admin/reports` - Reports & analytics
- `/admin/users` - User management
- `/admin/settings` - Settings

**User Routes (Protected, role: user):**
- `/user/dashboard` - User dashboard
- `/user/profile` - User profile
- `/user/transactions` - Transaction history
- `/user/transactions/:id` - Transaction detail
- `/user/appointments` - Appointments (if applicable)
- `/user/settings` - User settings

---

## Database Schema

### Table: users
```sql
- id (PK)
- name
- email (unique)
- password (hashed)
- role (enum: 'admin', 'user')
- is_active
- created_at
- updated_at
```

### Table: clients
```sql
- id (PK)
- name
- email
- phone
- address
- notes
- user_id (FK to users) - Admin yang menambahkan
- is_active
- created_at
- updated_at
```

### Table: services
```sql
- id (PK)
- name
- description
- price
- duration (in minutes)
- user_id (FK to users) - Admin yang menambahkan
- is_active
- created_at
- updated_at
```

### Table: transactions
```sql
- id (PK)
- client_id (FK to clients)
- service_id (FK to services)
- user_id (FK to users) - Admin yang mencatat
- amount
- date
- status (enum: 'pending', 'completed', 'cancelled')
- payment_method (enum: 'cash', 'transfer', 'e-wallet', 'other')
- notes
- created_at
- updated_at
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Admin Endpoints (Protected, role: admin)
**Clients:**
- `GET /api/admin/clients` - Get all clients
- `GET /api/admin/clients/:id` - Get client by ID
- `POST /api/admin/clients` - Create client
- `PUT /api/admin/clients/:id` - Update client
- `DELETE /api/admin/clients/:id` - Delete client

**Services:**
- `GET /api/admin/services` - Get all services
- `GET /api/admin/services/:id` - Get service by ID
- `POST /api/admin/services` - Create service
- `PUT /api/admin/services/:id` - Update service
- `DELETE /api/admin/services/:id` - Delete service

**Transactions:**
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/transactions/:id` - Get transaction by ID
- `POST /api/admin/transactions` - Create transaction
- `PUT /api/admin/transactions/:id` - Update transaction
- `DELETE /api/admin/transactions/:id` - Delete transaction

**Reports:**
- `GET /api/admin/reports/dashboard` - Dashboard stats
- `GET /api/admin/reports/revenue` - Revenue report
- `GET /api/admin/reports/clients` - Client report

**Users:**
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID

### User Endpoints (Protected, role: user)
**Profile:**
- `GET /api/user/profile` - Get own profile
- `PUT /api/user/profile` - Update own profile
- `PUT /api/user/password` - Change password

**Transactions:**
- `GET /api/user/transactions` - Get own transactions
- `GET /api/user/transactions/:id` - Get own transaction detail

---

## Teknologi yang Digunakan

### Frontend
- **React 18** - UI Library
- **Vite** - Build tool
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Formik + Yup** - Form handling & validation
- **React Icons** - Icons
- **React Toastify** - Notifications
- **Zustand** - State management
- **date-fns** - Date utilities

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **helmet** - Security
- **cors** - CORS handling
- **morgan** - Logging

---

## Next Steps

1. ✅ **Struktur folder sudah dibuat**
2. ⏳ **Implementasi Authentication**
3. ⏳ **Implementasi Role-based access control**
4. ⏳ **Buat layout Admin & User**
5. ⏳ **Implementasi fitur CRUD**
6. ⏳ **Integrasi Frontend & Backend**
7. ⏳ **Testing**
8. ⏳ **Deployment**

---

**Tunggu instruksi selanjutnya untuk melanjutkan development! 🚀**
