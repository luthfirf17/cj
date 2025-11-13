# 📦 Database Backup & Restore Guide - CatatJasamu

## 📋 Files Included

1. **`database_backup_complete.sql`** - Complete database schema (struktur tabel, indexes, triggers)
2. **`backup-database.sh`** - Script backup otomatis (Mac/Linux)
3. **`backup-database.bat`** - Script backup otomatis (Windows)
4. **`BACKUP_RESTORE_GUIDE.md`** - Panduan ini

---

## 🚀 Quick Start - Backup Data Anda

### Option 1: Menggunakan Script Otomatis

**Mac/Linux:**
```bash
chmod +x backup-database.sh
./backup-database.sh
```

**Windows:**
```cmd
backup-database.bat
```

Script akan membuat 4 jenis backup:
- `full_backup_YYYYMMDD_HHMMSS.sql` - Complete backup (recommended)
- `data_only_YYYYMMDD_HHMMSS.sql` - Data saja
- `schema_only_YYYYMMDD_HHMMSS.sql` - Struktur saja
- `compressed_backup_YYYYMMDD_HHMMSS.backup` - Compressed format

### Option 2: Manual Backup

```bash
# Complete backup (schema + data)
pg_dump -U postgres -d catat_jasamu_db -f my_backup.sql

# Data only
pg_dump -U postgres -d catat_jasamu_db --data-only --inserts -f data_backup.sql

# Compressed backup
pg_dump -U postgres -d catat_jasamu_db -F c -f backup.backup
```

---

## 📥 Restore di Device Baru

### Step 1: Install PostgreSQL di Device Baru

**Mac:**
```bash
brew install postgresql@17
brew services start postgresql@17
```

**Windows:**
Download dari: https://www.postgresql.org/download/windows/

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install postgresql-17
```

### Step 2: Create Database Baru

```bash
# Login sebagai postgres user
psql -U postgres

# Di psql prompt:
CREATE DATABASE catat_jasamu_db;
\q
```

### Step 3: Restore Schema

```bash
# Restore struktur database
psql -U postgres -d catat_jasamu_db -f database_backup_complete.sql
```

### Step 4: Restore Data

```bash
# Restore data dari backup Anda
psql -U postgres -d catat_jasamu_db -f full_backup_YYYYMMDD_HHMMSS.sql

# Atau jika pakai compressed backup:
pg_restore -U postgres -d catat_jasamu_db compressed_backup_YYYYMMDD_HHMMSS.backup
```

---

## 🔧 Setup Backend di Device Baru

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Database Connection

Edit `backend/src/config/database.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'catat_jasamu_db',
  password: 'your_postgres_password', // Sesuaikan password Anda
  port: 5432,
});

module.exports = { query: (text, params) => pool.query(text, params) };
```

### 3. Test Connection

```bash
cd backend
npm start
```

Backend should run on http://localhost:5001

---

## 🎨 Setup Frontend di Device Baru

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure API Endpoint

Check `frontend/src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:5001/api';
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend should run on http://localhost:3000

---

## ✅ Verification Checklist

Setelah restore, pastikan:

- [ ] Database terbuat: `psql -U postgres -l` (lihat `catat_jasamu_db`)
- [ ] Tabel ada: `psql -U postgres -d catat_jasamu_db -c "\dt"`
- [ ] Data ter-restore: `psql -U postgres -d catat_jasamu_db -c "SELECT COUNT(*) FROM users;"`
- [ ] Backend running: `curl http://localhost:5001/api/health`
- [ ] Frontend running: Buka browser ke http://localhost:3000
- [ ] Login berhasil dengan user existing

---

## 🆘 Troubleshooting

### Error: "role postgres does not exist"

```bash
# Create postgres user
createuser -s postgres

# Atau login dengan user lain:
psql -U your_system_username
```

### Error: "database catat_jasamu already exists"

```bash
# Drop dan buat ulang
psql -U postgres -c "DROP DATABASE IF EXISTS catat_jasamu_db;"
psql -U postgres -c "CREATE DATABASE catat_jasamu_db;"
```

### Error: "permission denied"

```bash
# Give permissions
psql -U postgres -d catat_jasamu_db -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;"
psql -U postgres -d catat_jasamu_db -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;"
```

### Backend can't connect to database

1. Check PostgreSQL is running:
   ```bash
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status postgresql
   
   # Windows
   # Check Services app untuk PostgreSQL service
   ```

2. Check database credentials in `backend/src/config/database.js`

3. Check PostgreSQL accepts local connections:
   ```bash
   psql -U postgres -d catat_jasamu_db -h localhost
   ```

---

## 📝 Notes

- **Password**: User passwords di-hash dengan bcrypt, jadi aman untuk di-backup
- **Security PIN**: PIN juga di-hash, aman untuk di-backup
- **File Uploads**: Jika ada upload logo company, backup folder `backend/uploads/` juga
- **Environment Variables**: Copy file `.env` jika ada

---

## 🔐 Security Reminders

1. **Jangan commit** backup files ke git (sudah ada di .gitignore)
2. **Encrypt** backup file jika berisi data sensitif:
   ```bash
   # Encrypt
   gpg -c full_backup.sql
   
   # Decrypt
   gpg full_backup.sql.gpg
   ```
3. **Store** backup di tempat aman (cloud storage pribadi, external drive)

---

## 📞 Quick Commands Reference

```bash
# List databases
psql -U postgres -l

# List tables
psql -U postgres -d catat_jasamu_db -c "\dt"

# Count records
psql -U postgres -d catat_jasamu_db -c "SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM clients) as clients,
    (SELECT COUNT(*) FROM services) as services,
    (SELECT COUNT(*) FROM bookings) as bookings,
    (SELECT COUNT(*) FROM payments) as payments,
    (SELECT COUNT(*) FROM expenses) as expenses;"

# Backup
pg_dump -U postgres -d catat_jasamu_db -f backup.sql

# Restore
psql -U postgres -d catat_jasamu_db -f backup.sql

# Drop all tables (clean slate)
psql -U postgres -d catat_jasamu_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## ✨ Selamat Menggunakan di Device Baru!

Jika ada pertanyaan atau error, cek troubleshooting section atau lihat logs:
- Backend logs: Console output saat `npm start`
- PostgreSQL logs: `/var/log/postgresql/` atau check dengan `journalctl -u postgresql`
