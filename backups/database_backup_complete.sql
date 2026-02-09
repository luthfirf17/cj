-- =====================================================
-- COMPLETE DATABASE BACKUP - CatatJasamu
-- Generated: November 8, 2025
-- PostgreSQL Database Schema and Data
-- =====================================================

-- Drop existing tables if they exist (for clean restore)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS expense_categories CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    is_active BOOLEAN DEFAULT true,
    security_pin VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- =====================================================
-- TABLE: company_settings
-- =====================================================
CREATE TABLE company_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_address TEXT,
    company_phone VARCHAR(20),
    company_email VARCHAR(100),
    company_logo_url TEXT,
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder_name VARCHAR(100),
    payment_instructions TEXT,
    bank_name_alt VARCHAR(100),
    account_number_alt VARCHAR(50),
    account_holder_name_alt VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =====================================================
-- TABLE: clients
-- =====================================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    company VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster queries
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(name);

-- =====================================================
-- TABLE: services
-- =====================================================
CREATE TABLE services (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15, 2) DEFAULT 0,
    duration INTEGER,
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_services_user_id ON services(user_id);
CREATE INDEX idx_services_name ON services(name);
CREATE INDEX idx_services_is_active ON services(is_active);

-- =====================================================
-- TABLE: bookings
-- =====================================================
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    booking_time TIME,
    location_name VARCHAR(255),
    location_map_url TEXT,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled')),
    total_price DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- =====================================================
-- TABLE: payments
-- =====================================================
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    payment_date TIMESTAMP,
    payment_method VARCHAR(50) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'credit_card', 'debit_card', 'e-wallet')),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- =====================================================
-- TABLE: expense_categories
-- =====================================================
CREATE TABLE expense_categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) DEFAULT '#6B7280',
    icon VARCHAR(10) DEFAULT '📝',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index
CREATE INDEX idx_expense_categories_user_id ON expense_categories(user_id);

-- Insert default expense categories
INSERT INTO expense_categories (user_id, name, color, icon, is_default) VALUES
(NULL, 'Gaji Tim', '#3B82F6', '👥', true),
(NULL, 'Pembelian Barang', '#10B981', '🛒', true),
(NULL, 'Operasional', '#F59E0B', '⚙️', true),
(NULL, 'Marketing', '#8B5CF6', '📢', true),
(NULL, 'Transportasi', '#06B6D4', '🚗', true),
(NULL, 'Utilitas', '#EF4444', '💡', true),
(NULL, 'Lainnya', '#6B7280', '📝', true);

-- =====================================================
-- TABLE: expenses
-- =====================================================
CREATE TABLE expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES expense_categories(id) ON DELETE SET NULL,
    amount DECIMAL(15, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    expense_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_category_id ON expenses(category_id);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- =====================================================
-- CREATE TRIGGERS FOR updated_at
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at BEFORE UPDATE ON company_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VIEWS (Optional - for easier queries)
-- =====================================================

-- View for bookings with related data
CREATE OR REPLACE VIEW bookings_with_details AS
SELECT 
    b.id,
    b.user_id,
    b.booking_date,
    b.booking_time,
    b.status,
    b.total_price,
    b.location_name,
    b.location_map_url,
    b.notes,
    b.created_at,
    b.updated_at,
    c.id as client_id,
    c.name as client_name,
    c.phone as contact,
    c.address,
    s.id as service_id,
    s.name as service_name,
    s.price as service_price,
    p.payment_status,
    p.amount as amount_paid
FROM bookings b
LEFT JOIN clients c ON b.client_id = c.id
LEFT JOIN services s ON b.service_id = s.id
LEFT JOIN payments p ON b.id = p.booking_id;

-- View for expenses with categories
CREATE OR REPLACE VIEW expenses_with_categories AS
SELECT 
    e.id,
    e.user_id,
    e.amount,
    e.description,
    e.expense_date,
    e.notes,
    e.created_at,
    ec.id as category_id,
    ec.name as category_name,
    ec.color as category_color,
    ec.icon as category_icon
FROM expenses e
LEFT JOIN expense_categories ec ON e.category_id = ec.id;

-- =====================================================
-- GRANT PERMISSIONS (if needed)
-- =====================================================
-- Grant permissions to your database user if needed
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;

-- =====================================================
-- BACKUP COMPLETE
-- =====================================================
-- To restore this database on your new device:
-- 1. Create a new database: createdb catat_jasamu_db
-- 2. Restore: psql -U your_username -d catat_jasamu_db -f database_backup_complete.sql
-- 
-- To backup existing data:
-- pg_dump -U your_username -d catat_jasamu_db --data-only --inserts -f data_backup.sql
-- =====================================================
