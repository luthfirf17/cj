-- =====================================================
-- SEED DATA - Default Expense Categories
-- =====================================================

-- Insert default expense categories (akan digunakan oleh semua user)
-- Check if categories already exist before inserting
INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Gaji Tim', '#3B82F6', '👥', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Gaji Tim' AND user_id IS NULL);

INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Pembelian Barang', '#10B981', '🛒', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Pembelian Barang' AND user_id IS NULL);

INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Operasional', '#F59E0B', '⚙️', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Operasional' AND user_id IS NULL);

INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Marketing', '#8B5CF6', '📢', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Marketing' AND user_id IS NULL);

INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Transportasi', '#06B6D4', '🚗', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Transportasi' AND user_id IS NULL);

INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Utilitas', '#EF4444', '💡', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Utilitas' AND user_id IS NULL);

INSERT INTO expense_categories (user_id, name, color, icon, is_default)
SELECT NULL, 'Lainnya', '#6B7280', '📝', true
WHERE NOT EXISTS (SELECT 1 FROM expense_categories WHERE name = 'Lainnya' AND user_id IS NULL);

-- =====================================================
-- SEED DATA - Sample Admin User (Opsional)
-- =====================================================

-- Uncomment baris di bawah ini jika ingin membuat user admin default
-- Password: admin123 (hashed dengan bcrypt)
-- INSERT INTO users (username, email, password, full_name, role) VALUES
-- ('admin', 'admin@catatjasamu.com', '$2a$10$8K1p/5w6QyT1Vz2v9zXcOeJcQw9dJcQw9dJcQw9dJcQw9dJcQw9d', 'Administrator', 'admin')
-- ON CONFLICT (email) DO NOTHING;