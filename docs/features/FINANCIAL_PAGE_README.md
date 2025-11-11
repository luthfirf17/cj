# 💰 Financial Page - Instruksi Setup

## 📋 Deskripsi
Halaman Keuangan adalah fitur baru yang memungkinkan user untuk:
- Melihat ringkasan keuangan (pendapatan, pengeluaran, profit)
- Mengelola pengeluaran perusahaan dengan kategori
- Analisis keuangan dengan chart interaktif
- CRUD kategori pengeluaran custom

## 🚀 Cara Mengaktifkan

### 1. Jalankan Migration Database

Jalankan query SQL berikut di PostgreSQL untuk membuat tabel yang diperlukan:

```bash
psql -U your_username -d your_database -f backend/migrations/create_expenses_tables.sql
```

Atau copy-paste langsung ke pgAdmin/DBeaver:

```sql
-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#6B7280',
  icon VARCHAR(10) DEFAULT '💰',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  expense_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES expense_categories(id) ON DELETE RESTRICT
);

-- Insert default categories
INSERT INTO expense_categories (user_id, name, color, icon, is_default) VALUES
  (NULL, 'Gaji Tim', '#3B82F6', '👥', TRUE),
  (NULL, 'Pembelian Barang', '#10B981', '🛒', TRUE),
  (NULL, 'Operasional', '#F59E0B', '⚙️', TRUE),
  (NULL, 'Marketing', '#8B5CF6', '📢', TRUE),
  (NULL, 'Transportasi', '#06B6D4', '🚗', TRUE),
  (NULL, 'Utilitas', '#EF4444', '💡', TRUE),
  (NULL, 'Lainnya', '#6B7280', '📝', TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON expense_categories(user_id);
```

### 2. Install Dependencies (Jika Belum)

```bash
cd frontend
npm install recharts
```

### 3. Restart Backend Server

```bash
cd backend
npm run dev
```

### 4. Restart Frontend

```bash
cd frontend
npm start
```

## 📱 Cara Menggunakan

### Akses Halaman Keuangan

1. Login ke aplikasi
2. Di navbar atas, klik icon **📊 Statistik** (icon BarChart)
3. Anda akan diarahkan ke halaman `/user/financial`

### Fitur-Fitur Utama

#### 1. **Dashboard Keuangan**
- 6 Card menampilkan:
  - Total Pendapatan (dari booking)
  - Sudah Diterima (payment received)
  - Belum Dibayar (outstanding)
  - Total Pengeluaran (expenses)
  - Pendapatan Bersih (net income)
  - Status Pembayaran (ringkasan)

#### 2. **Manajemen Pengeluaran**
- Tambah pengeluaran baru
- Edit pengeluaran existing
- Hapus pengeluaran
- Filter by bulan, tahun, kategori
- Table view dengan detail lengkap

#### 3. **Kategori Pengeluaran**
- 7 kategori default (tidak bisa dihapus):
  - 👥 Gaji Tim
  - 🛒 Pembelian Barang
  - ⚙️ Operasional
  - 📢 Marketing
  - 🚗 Transportasi
  - 💡 Utilitas
  - 📝 Lainnya
- Buat kategori custom dengan:
  - Nama kategori
  - Warna (8 pilihan)
  - Icon (14 pilihan emoji)

#### 4. **Analisis Visual**
- Pie Chart: Pengeluaran per kategori
- Filter berdasarkan periode
- Responsive charts dengan Recharts

## 🎨 Fitur Desain

### Modern & Professional
- Gradient backgrounds
- Smooth animations
- Hover effects
- Card shadows
- Color-coded categories
- Responsive layout

### User Experience
- Real-time updates
- Confirmation dialogs
- Error handling
- Loading states
- Empty states dengan ilustrasi

## 🔧 API Endpoints Baru

### Expenses
```
GET    /api/user/expenses                    - Get all expenses
GET    /api/user/expenses/:id                - Get expense by ID
POST   /api/user/expenses                    - Create expense
PUT    /api/user/expenses/:id                - Update expense
DELETE /api/user/expenses/:id                - Delete expense
```

### Categories
```
GET    /api/user/expense-categories          - Get all categories
POST   /api/user/expense-categories          - Create category
PUT    /api/user/expense-categories/:id      - Update category
DELETE /api/user/expense-categories/:id      - Delete category
```

### Financial Summary
```
GET    /api/user/financial-summary           - Get financial overview
```

## 📊 Database Schema

### Table: `expense_categories`
```
id              SERIAL PRIMARY KEY
user_id         INTEGER (NULL for default categories)
name            VARCHAR(100)
color           VARCHAR(20)
icon            VARCHAR(10)
is_default      BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

### Table: `expenses`
```
id              SERIAL PRIMARY KEY
user_id         INTEGER NOT NULL
category_id     INTEGER NOT NULL
amount          DECIMAL(15, 2)
description     VARCHAR(255)
expense_date    DATE
notes           TEXT
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## ⚠️ Catatan Penting

1. **Kategori Default**: Kategori dengan `is_default = TRUE` tidak bisa diedit/dihapus
2. **Cascade Delete**: Jika user dihapus, semua expense & kategori custom ikut terhapus
3. **Restrict Delete**: Kategori yang sudah ada expensenya tidak bisa dihapus
4. **Currency**: Semua amount dalam IDR (Indonesian Rupiah)
5. **Filter**: Default filter adalah bulan & tahun sekarang

## 🐛 Troubleshooting

### "Table does not exist"
- Pastikan sudah menjalankan migration SQL
- Check connection database di backend

### "recharts is not defined"
- Install recharts: `npm install recharts`
- Restart frontend

### "Cannot read property 'total_revenue'"
- Check API backend sudah running
- Verify endpoint `/api/user/financial-summary` accessible

### Icon tidak muncul
- Pastikan react-icons sudah terinstall
- Check console browser untuk error

## 📝 TODO / Future Improvements

- [ ] Export to Excel/PDF
- [ ] Recurring expenses
- [ ] Budget planning
- [ ] Multi-currency support
- [ ] Expense approval workflow
- [ ] Receipt upload
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Comparison year-over-year

## 💡 Tips Penggunaan

1. Buat kategori sesuai kebutuhan bisnis Anda
2. Gunakan filter bulan untuk melihat trend pengeluaran
3. Review pie chart untuk identifikasi kategori terbesar
4. Monitor net income untuk kesehatan finansial
5. Export data secara berkala untuk backup

---

**Developed with ❤️ for CatatJasamu**
