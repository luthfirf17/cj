# 🗄️ Database Setup - Catat Jasamu

## ✅ Status: Connected to PostgreSQL

### 📊 Database Information

- **Database Name:** `catat_jasamu_db`
- **Host:** `localhost`
- **Port:** `5432`
- **User:** `postgres`
- **Password:** `1234`

### 🏗️ Database Structure

#### Tables Created:

1. **users** - Menyimpan data pengguna (admin & user)
   - id, email, password, full_name, phone, role, avatar_url
   - Timestamps: created_at, updated_at

2. **clients** - Menyimpan data klien
   - id, user_id, name, email, phone, address, company, notes
   - Timestamps: created_at, updated_at

3. **services** - Menyimpan data layanan
   - id, user_id, name, description, price, duration, category, is_active
   - Timestamps: created_at, updated_at

4. **bookings** - Menyimpan data booking
   - id, user_id, client_id, service_id, booking_date, booking_time, status, total_price, notes
   - Status: pending, confirmed, completed, cancelled
   - Timestamps: created_at, updated_at

5. **payments** - Menyimpan data pembayaran
   - id, booking_id, amount, payment_method, payment_status, payment_date, notes
   - Payment Method: cash, transfer, credit_card, e-wallet
   - Payment Status: unpaid, partial, paid, refunded
   - Timestamps: created_at, updated_at

### 📈 Demo Data

#### Users:
- **Admin:** admin@catatjasamu.com (password: password123)
- **User:** user@catatjasamu.com (password: password123)

#### Statistics (User Demo):
- Total Clients: 5
- Total Services: 5
- Total Bookings: 4
- Total Payments: 2

### 🔧 How to Use

#### 1. Setup Database (First Time Only)
```bash
cd backend
npm run db:setup
```

This will:
- ✅ Create database `catat_jasamu_db`
- ✅ Create all tables with indexes
- ✅ Insert demo data
- ✅ Setup triggers for auto-update timestamps

#### 2. Manual Migration (if needed)
```bash
cd backend
npm run db:migrate
```

### 📡 API Endpoints (Connected to Database)

All endpoints now fetch data from PostgreSQL database:

#### User Endpoints:
- **GET** `/api/user/dashboard/stats?user_id=2` - Dashboard statistics
- **GET** `/api/user/bookings?user_id=2&page=1&pageSize=10` - List bookings
- **GET** `/api/user/services?user_id=2` - List services
- **GET** `/api/user/clients?user_id=2` - List clients

### 🚀 Running the Application

#### Backend (Port 5001):
```bash
cd backend
npm run dev
```

#### Frontend (Port 3000):
```bash
cd frontend
npm run dev
```

### 🔍 View Database in pgAdmin 4

1. Open pgAdmin 4
2. Connect to server: `catat_jasamu_db`
3. Navigate to: Databases → catat_jasamu_db → Schemas → public → Tables

### 📝 Database Queries Examples

#### Get all users:
```sql
SELECT * FROM users;
```

#### Get bookings with client and service info:
```sql
SELECT 
    b.id,
    c.name as client_name,
    s.name as service_name,
    b.booking_date,
    b.status,
    b.total_price
FROM bookings b
JOIN clients c ON b.client_id = c.id
JOIN services s ON b.service_id = s.id
ORDER BY b.booking_date DESC;
```

#### Get payment summary:
```sql
SELECT 
    payment_status,
    COUNT(*) as total_transactions,
    SUM(amount) as total_amount
FROM payments
GROUP BY payment_status;
```

### ⚙️ Configuration

Database configuration is stored in `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=catat_jasamu_db
DB_USER=postgres
DB_PASSWORD=1234
```

### 🔐 Security Notes

- ✅ Passwords in demo data are hashed with bcrypt
- ✅ Database connection uses environment variables
- ✅ SQL injection prevention with parameterized queries
- ✅ Error handling for database operations

### 📊 Performance Optimizations

- ✅ Connection pooling configured (max 20 connections)
- ✅ Indexes created on frequently queried columns
- ✅ Automatic timestamp updates with triggers
- ✅ Query logging for monitoring

### 🎯 Next Steps

1. ✅ Database connected and working
2. ✅ Demo data available
3. ⏳ Implement authentication (JWT)
4. ⏳ Create more CRUD endpoints
5. ⏳ Add search and filtering
6. ⏳ Implement real-time updates
7. ⏳ Add data validation
8. ⏳ Setup backup strategy

---

**Status:** ✅ Database fully operational and connected to backend API!
