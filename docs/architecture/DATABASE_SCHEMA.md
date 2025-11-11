# 🗄️ Database Schema Documentation - CatatJasamu

**Last Updated:** November 5, 2025  
**Database:** PostgreSQL 17  
**Database Name:** `catat_jasamu_db`

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Entity Relationship Diagram](#-entity-relationship-diagram)
3. [Tables](#-tables)
   - [users](#1-users)
   - [clients](#2-clients)
   - [services](#3-services)
   - [bookings](#4-bookings)
   - [payments](#5-payments)
   - [expenses](#6-expenses)
   - [expense_categories](#7-expense_categories)
   - [company_settings](#8-company_settings)
4. [Relationships](#-relationships)
5. [Indexes](#-indexes)
6. [Migrations History](#-migrations-history)
7. [Security Features](#-security-features)

---

## 🎯 Overview

Aplikasi **CatatJasamu** menggunakan PostgreSQL sebagai database utama dengan arsitektur **Multi-Tenancy** di mana setiap user (pemilik bisnis) memiliki data terpisah untuk clients, services, bookings, dan transactions mereka sendiri.

### Key Features:
- ✅ **Multi-Tenancy:** Data isolation per user
- ✅ **Role-Based Access:** Admin & User roles
- ✅ **Financial Management:** Bookings, Payments, Expenses
- ✅ **Security:** PIN protection, password hashing (bcrypt)
- ✅ **Audit Trail:** Timestamps on all tables

### Database Statistics:
- **Total Tables:** 8
- **Total Relationships:** 7 foreign keys
- **Indexes:** Multiple indexes for performance optimization

---

## 🔗 Entity Relationship Diagram

```
┌─────────────┐
│    users    │ (1)
└──────┬──────┘
       │ has many
       ├──────────────────┬──────────────────┬──────────────────┐
       │                  │                  │                  │
       ↓ (N)              ↓ (N)              ↓ (N)              ↓ (N)
┌──────────┐       ┌──────────┐       ┌──────────┐       ┌──────────────────┐
│ clients  │       │ services │       │ bookings │       │ company_settings │
└─────┬────┘       └─────┬────┘       └────┬─────┘       └──────────────────┘
      │                  │                  │
      │                  │                  │ has one
      │                  │                  ↓ (1)
      │                  │            ┌──────────┐
      └──────────────────┴───────────>│ payments │
                                      └──────────┘

┌─────────────┐
│    users    │ (1)
└──────┬──────┘
       │ has many
       ├──────────────────┐
       │                  │
       ↓ (N)              ↓ (N)
┌──────────┐       ┌────────────────────┐
│ expenses │       │ expense_categories │
└────┬─────┘       └────────────────────┘
     │ belongs to
     └─────────────> expense_categories
```

---

## 📊 Tables

### 1. users

**Purpose:** Menyimpan data pengguna aplikasi (pemilik bisnis)

| Column       | Type         | Constraints                    | Description                          |
|--------------|--------------|--------------------------------|--------------------------------------|
| id           | SERIAL       | PRIMARY KEY                    | Unique identifier                    |
| email        | VARCHAR(255) | UNIQUE NOT NULL                | Email login (unique)                 |
| password     | VARCHAR(255) | NOT NULL                       | Hashed password (bcrypt)             |
| full_name    | VARCHAR(255) | NOT NULL                       | Full name of user                    |
| phone        | VARCHAR(20)  |                                | Phone number                         |
| role         | VARCHAR(50)  | DEFAULT 'user'                 | Role: 'admin' or 'user'              |
| avatar_url   | TEXT         |                                | Profile picture URL                  |
| security_pin | VARCHAR(255) |                                | 6-digit PIN (hashed) for security    |
| created_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Account creation time                |
| updated_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Last update time                     |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `email`
- INDEX on `security_pin` (`idx_users_security_pin`)

**Business Rules:**
- Email must be unique across all users
- Password hashed using bcrypt (salt rounds: 10)
- Security PIN is optional but required for certain sensitive operations
- PIN is also hashed using bcrypt

**Demo Data:**
```sql
-- Admin account
email: 'admin@catatjasamu.com'
password: 'password123' (hashed)

-- User account
email: 'user@catatjasamu.com'
password: 'password123' (hashed)
```

---

### 2. clients

**Purpose:** Menyimpan data klien/pelanggan dari setiap user

| Column      | Type         | Constraints                    | Description                          |
|-------------|--------------|--------------------------------|--------------------------------------|
| id          | SERIAL       | PRIMARY KEY                    | Unique identifier                    |
| user_id     | INTEGER      | NOT NULL REFERENCES users(id)  | Owner of this client                 |
| name        | VARCHAR(255) | NOT NULL                       | Client name                          |
| email       | VARCHAR(255) |                                | Client email                         |
| phone       | VARCHAR(20)  | NOT NULL                       | Client phone                         |
| address     | TEXT         |                                | Client address                       |
| company     | VARCHAR(255) |                                | Client company name                  |
| notes       | TEXT         |                                | Additional notes                     |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Creation time                        |
| updated_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Last update time                     |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id` → `users(id)`
- INDEX on `user_id` for faster queries

**Business Rules:**
- Each client belongs to exactly one user (multi-tenancy)
- Users can only see/manage their own clients
- Phone number is required (for contact)

---

### 3. services

**Purpose:** Menyimpan data layanan/jasa yang ditawarkan oleh user

| Column      | Type          | Constraints                    | Description                          |
|-------------|---------------|--------------------------------|--------------------------------------|
| id          | SERIAL        | PRIMARY KEY                    | Unique identifier                    |
| user_id     | INTEGER       | NOT NULL REFERENCES users(id)  | Owner of this service                |
| name        | VARCHAR(255)  | NOT NULL                       | Service name                         |
| description | TEXT          |                                | Service description                  |
| price       | DECIMAL(10,2) | NOT NULL DEFAULT 0             | Service price                        |
| duration    | INTEGER       |                                | Duration in minutes                  |
| category    | VARCHAR(100)  |                                | Service category                     |
| is_active   | BOOLEAN       | DEFAULT true                   | Active status                        |
| created_at  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP      | Creation time                        |
| updated_at  | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP      | Last update time                     |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id` → `users(id)`
- INDEX on `user_id` for faster queries
- INDEX on `is_active` for filtering

**Business Rules:**
- Each service belongs to exactly one user
- Price is stored as DECIMAL for precision
- Services can be deactivated (soft delete) instead of being deleted

---

### 4. bookings

**Purpose:** Menyimpan data booking/pemesanan layanan

| Column        | Type          | Constraints                       | Description                          |
|---------------|---------------|-----------------------------------|--------------------------------------|
| id            | SERIAL        | PRIMARY KEY                       | Unique identifier                    |
| user_id       | INTEGER       | NOT NULL REFERENCES users(id)     | Owner of this booking                |
| client_id     | INTEGER       | NOT NULL REFERENCES clients(id)   | Client who booked                    |
| service_id    | INTEGER       | NOT NULL REFERENCES services(id)  | Service being booked                 |
| booking_date  | DATE          | NOT NULL                          | Date of booking                      |
| booking_time  | TIME          | NOT NULL                          | Time of booking                      |
| status        | VARCHAR(50)   | DEFAULT 'pending'                 | Status of booking                    |
| total_price   | DECIMAL(10,2) | NOT NULL                          | Total price                          |
| notes         | TEXT          |                                   | Additional notes                     |
| created_at    | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP         | Creation time                        |
| updated_at    | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP         | Last update time                     |

**Status Values:**
- `pending` - Menunggu konfirmasi
- `confirmed` - Dikonfirmasi/Terjadwal
- `completed` - Selesai dilakukan
- `cancelled` - Dibatalkan

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id` → `users(id)`
- FOREIGN KEY on `client_id` → `clients(id)`
- FOREIGN KEY on `service_id` → `services(id)`
- INDEX on `user_id` for faster queries
- INDEX on `booking_date` for date-based queries
- INDEX on `status` for filtering

**Business Rules:**
- Each booking belongs to one user, one client, and one service
- Booking date and time cannot be null
- Total price copied from service price at booking time
- Status workflow: pending → confirmed → completed (or cancelled)

---

### 5. payments

**Purpose:** Menyimpan data pembayaran untuk booking

| Column         | Type          | Constraints                       | Description                          |
|----------------|---------------|-----------------------------------|--------------------------------------|
| id             | SERIAL        | PRIMARY KEY                       | Unique identifier                    |
| booking_id     | INTEGER       | NOT NULL REFERENCES bookings(id)  | Related booking                      |
| amount         | DECIMAL(10,2) | NOT NULL                          | Payment amount                       |
| payment_method | VARCHAR(50)   |                                   | Method of payment                    |
| payment_status | VARCHAR(50)   | DEFAULT 'unpaid'                  | Payment status                       |
| payment_date   | TIMESTAMP     |                                   | Date of payment                      |
| notes          | TEXT          |                                   | Additional notes                     |
| created_at     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP         | Creation time                        |
| updated_at     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP         | Last update time                     |

**Payment Method Values:**
- `cash` - Tunai
- `transfer` - Transfer Bank
- `credit_card` - Kartu Kredit
- `e-wallet` - E-Wallet (GoPay, OVO, dll)

**Payment Status Values:**
- `unpaid` - Belum dibayar
- `partial` - Dibayar sebagian (DP)
- `paid` - Lunas
- `refunded` - Dikembalikan

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `booking_id` → `bookings(id)`
- INDEX on `booking_id` for faster lookups
- INDEX on `payment_status` for filtering

**Business Rules:**
- One booking can have one payment record
- Amount can be partial (down payment) or full
- Payment status updated based on amount vs booking total_price

---

### 6. expenses

**Purpose:** Menyimpan data pengeluaran bisnis

| Column         | Type          | Constraints                              | Description                          |
|----------------|---------------|------------------------------------------|--------------------------------------|
| id             | SERIAL        | PRIMARY KEY                              | Unique identifier                    |
| user_id        | INTEGER       | NOT NULL REFERENCES users(id)            | Owner of this expense                |
| category_id    | INTEGER       | REFERENCES expense_categories(id)        | Expense category                     |
| amount         | DECIMAL(10,2) | NOT NULL                                 | Expense amount                       |
| description    | TEXT          | NOT NULL                                 | Expense description                  |
| expense_date   | DATE          | NOT NULL                                 | Date of expense                      |
| notes          | TEXT          |                                          | Additional notes                     |
| created_at     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                | Creation time                        |
| updated_at     | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                | Last update time                     |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id` → `users(id)`
- FOREIGN KEY on `category_id` → `expense_categories(id)`
- INDEX on `user_id` for faster queries
- INDEX on `expense_date` for date-based queries
- INDEX on `category_id` for filtering

**Business Rules:**
- Each expense belongs to exactly one user
- Expense can be categorized (optional)
- Amount must be positive
- Used for financial tracking and profit calculation

---

### 7. expense_categories

**Purpose:** Menyimpan kategori pengeluaran (preset + custom per user)

| Column      | Type         | Constraints               | Description                          |
|-------------|--------------|---------------------------|--------------------------------------|
| id          | SERIAL       | PRIMARY KEY               | Unique identifier                    |
| user_id     | INTEGER      | REFERENCES users(id)      | Owner (NULL for default categories)  |
| name        | VARCHAR(100) | NOT NULL                  | Category name                        |
| description | TEXT         |                           | Category description                 |
| color       | VARCHAR(20)  |                           | Display color (hex)                  |
| icon        | VARCHAR(50)  |                           | Icon identifier                      |
| is_default  | BOOLEAN      | DEFAULT false             | System default category              |
| created_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Creation time                        |
| updated_at  | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP | Last update time                     |

**Indexes:**
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id` → `users(id)` (nullable)
- INDEX on `user_id` for faster queries
- INDEX on `is_default` for filtering

**Business Rules:**
- Default categories have `user_id = NULL` and `is_default = true`
- Users can create custom categories (user_id set, is_default = false)
- Default categories visible to all users
- Users can only edit/delete their own custom categories

**Default Categories:**
```sql
1. Bahan Baku (Raw Materials) - 🛒
2. Operasional (Operational) - ⚙️
3. Gaji (Salary) - 💰
4. Marketing - 📢
5. Transportasi (Transportation) - 🚗
6. Utilitas (Utilities) - 💡
7. Lain-lain (Others) - 📦
```

---

### 8. company_settings

**Purpose:** Menyimpan pengaturan perusahaan/bisnis per user

| Column       | Type         | Constraints                    | Description                          |
|--------------|--------------|--------------------------------|--------------------------------------|
| id           | SERIAL       | PRIMARY KEY                    | Unique identifier                    |
| user_id      | INTEGER      | UNIQUE NOT NULL REFERENCES users(id) | Owner (one setting per user)   |
| company_name | VARCHAR(255) |                                | Company/Business name                |
| address      | TEXT         |                                | Company address                      |
| phone        | VARCHAR(20)  |                                | Company phone                        |
| email        | VARCHAR(255) |                                | Company email                        |
| logo_url     | TEXT         |                                | Company logo URL                     |
| website      | VARCHAR(255) |                                | Company website                      |
| created_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Creation time                        |
| updated_at   | TIMESTAMP    | DEFAULT CURRENT_TIMESTAMP      | Last update time                     |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE FOREIGN KEY on `user_id` → `users(id)`

**Business Rules:**
- One user can have only one company settings record
- Used for invoice/receipt generation
- Optional - can be filled gradually

---

## 🔗 Relationships

### users → clients (1:N)
- One user can have many clients
- `clients.user_id` → `users.id`

### users → services (1:N)
- One user can have many services
- `services.user_id` → `users.id`

### users → bookings (1:N)
- One user can have many bookings
- `bookings.user_id` → `users.id`

### users → expenses (1:N)
- One user can have many expenses
- `expenses.user_id` → `users.id`

### users → expense_categories (1:N)
- One user can have many custom categories
- `expense_categories.user_id` → `users.id` (nullable)

### users → company_settings (1:1)
- One user has one company settings
- `company_settings.user_id` → `users.id` (UNIQUE)

### clients → bookings (1:N)
- One client can have many bookings
- `bookings.client_id` → `clients.id`

### services → bookings (1:N)
- One service can be booked many times
- `bookings.service_id` → `services.id`

### bookings → payments (1:1)
- One booking has one payment record
- `payments.booking_id` → `bookings.id`

### expense_categories → expenses (1:N)
- One category can have many expenses
- `expenses.category_id` → `expense_categories.id`

---

## 📑 Indexes

### Performance Optimization Indexes:

1. **users table:**
   - `idx_users_email` (UNIQUE) - Fast login lookup
   - `idx_users_security_pin` - PIN verification

2. **clients table:**
   - `idx_clients_user_id` - Multi-tenancy queries

3. **services table:**
   - `idx_services_user_id` - Multi-tenancy queries
   - `idx_services_is_active` - Active services filter

4. **bookings table:**
   - `idx_bookings_user_id` - Multi-tenancy queries
   - `idx_bookings_client_id` - Client history
   - `idx_bookings_service_id` - Service usage
   - `idx_bookings_date` - Date range queries
   - `idx_bookings_status` - Status filtering

5. **payments table:**
   - `idx_payments_booking_id` - Payment lookup
   - `idx_payments_status` - Status filtering

6. **expenses table:**
   - `idx_expenses_user_id` - Multi-tenancy queries
   - `idx_expenses_category_id` - Category filtering
   - `idx_expenses_date` - Date range queries

7. **expense_categories table:**
   - `idx_expense_categories_user_id` - User categories
   - `idx_expense_categories_is_default` - Default categories

8. **company_settings table:**
   - `idx_company_settings_user_id` (UNIQUE) - One per user

---

## 🔄 Migrations History

### Migration Files:
1. **Initial Setup** - Created base tables (users, clients, services, bookings, payments)
2. **create_expenses_tables.sql** - Added expense tracking (expenses, expense_categories)
3. **004_create_company_settings.sql** - Added company settings table
4. **005_add_security_pin.sql** - Added security_pin column to users (VARCHAR(6))
5. **006_fix_security_pin_length.sql** - Changed security_pin to VARCHAR(255) for bcrypt hash

### How to Run Migrations:
```bash
cd backend
node migrations/run_migration.js
```

Or manually:
```bash
/Library/PostgreSQL/17/bin/psql -U postgres -d catat_jasamu_db -f migrations/[filename].sql
```

---

## 🔐 Security Features

### 1. Password Security
- All passwords hashed using **bcrypt** (salt rounds: 10)
- No plain text passwords stored
- Hash length: 60 characters (stored in VARCHAR(255))

### 2. PIN Security
- 6-digit numeric PIN for sensitive operations
- Also hashed using **bcrypt**
- Used for:
  - Deleting booking records
  - Accessing Financial Dashboard
  - Resetting password (forgot password feature)

### 3. Multi-Tenancy Security
- All data queries filtered by `user_id`
- Users cannot access other users' data
- Enforced at middleware level (`enforceTenancy`)

### 4. SQL Injection Prevention
- All queries use parameterized statements
- PostgreSQL `pg` library handles escaping

### 5. Role-Based Access Control (RBAC)
- Two roles: `admin` and `user`
- Role checked on protected routes
- Middleware: `authenticate` + `enforceTenancy`

---

## 📊 Database Queries Examples

### Get User Statistics:
```sql
SELECT 
  (SELECT COUNT(*) FROM clients WHERE user_id = $1) as total_clients,
  (SELECT COUNT(*) FROM services WHERE user_id = $1) as total_services,
  (SELECT COUNT(*) FROM bookings WHERE user_id = $1) as total_bookings,
  (SELECT COUNT(*) FROM payments WHERE payment_status = 'paid') as paid_payments;
```

### Get Bookings with Related Data:
```sql
SELECT 
  b.id,
  b.booking_date,
  b.booking_time,
  b.status,
  b.total_price,
  c.name as client_name,
  c.phone as client_phone,
  s.name as service_name,
  COALESCE(p.payment_status, 'unpaid') as payment_status,
  COALESCE(p.amount, 0) as amount_paid
FROM bookings b
JOIN clients c ON b.client_id = c.id
JOIN services s ON b.service_id = s.id
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.user_id = $1
ORDER BY b.booking_date DESC, b.booking_time DESC;
```

### Financial Summary (Monthly):
```sql
-- Revenue
SELECT 
  COALESCE(SUM(total_price), 0) as total_revenue,
  COALESCE(SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END), 0) as total_paid
FROM bookings b
LEFT JOIN payments p ON b.id = p.booking_id
WHERE b.user_id = $1 
  AND EXTRACT(MONTH FROM b.booking_date) = $2 
  AND EXTRACT(YEAR FROM b.booking_date) = $3;

-- Expenses
SELECT COALESCE(SUM(amount), 0) as total_expenses
FROM expenses
WHERE user_id = $1 
  AND EXTRACT(MONTH FROM expense_date) = $2 
  AND EXTRACT(YEAR FROM expense_date) = $3;
```

### Expense by Category:
```sql
SELECT 
  ec.name as category_name,
  ec.color as category_color,
  COUNT(e.id) as expense_count,
  SUM(e.amount) as total_amount
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id
WHERE e.user_id = $1
GROUP BY ec.id, ec.name, ec.color
ORDER BY total_amount DESC;
```

---

## 🎯 Database Best Practices

### ✅ Implemented:
- Timestamps on all tables (created_at, updated_at)
- Foreign key constraints for referential integrity
- Indexes on frequently queried columns
- Connection pooling (max 20 connections)
- Parameterized queries to prevent SQL injection
- Soft deletes where applicable (is_active flag)

### 📋 Recommended:
- Regular database backups
- Query performance monitoring
- Database migration versioning
- Add database triggers for audit logs
- Implement full-text search on text fields
- Add database views for complex queries

---

## 📝 Notes

### Multi-Tenancy Pattern:
Aplikasi ini menggunakan **Shared Database, Shared Schema** pattern:
- Single database untuk semua users
- Data isolation melalui `user_id` foreign key
- Middleware `enforceTenancy` memastikan query filtering

### Data Flow:
```
User Login → JWT Token (with user_id) → 
API Request (with token) → 
Middleware (authenticate + enforceTenancy) → 
Query with user_id filter → 
Return only user's data
```

### Backup Strategy:
```bash
# Backup database
pg_dump -U postgres catat_jasamu_db > backup_$(date +%Y%m%d).sql

# Restore database
psql -U postgres catat_jasamu_db < backup_20251105.sql
```

---

**Documentation maintained by:** Development Team  
**For questions:** Contact tech team  
**Last review:** November 5, 2025

---

