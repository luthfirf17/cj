-- =====================================================
-- SEED DATA - Default Expense Categories
-- =====================================================

-- Insert default expense categories (akan digunakan oleh semua user)
INSERT INTO expense_categories (user_id, name, color, icon, is_default) VALUES
(NULL, 'Gaji Tim', '#3B82F6', '👥', true),
(NULL, 'Pembelian Barang', '#10B981', '🛒', true),
(NULL, 'Operasional', '#F59E0B', '⚙️', true),
(NULL, 'Marketing', '#8B5CF6', '📢', true),
(NULL, 'Transportasi', '#06B6D4', '🚗', true),
(NULL, 'Utilitas', '#EF4444', '💡', true),
(NULL, 'Lainnya', '#6B7280', '📝', true)
ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;

-- =====================================================
-- SEED DATA - Sample Admin User (Opsional)
-- =====================================================

-- Uncomment baris di bawah ini jika ingin membuat user admin default
-- Password: admin123 (hashed dengan bcrypt)
-- INSERT INTO users (username, email, password, full_name, role) VALUES
-- ('admin', 'admin@catatjasamu.com', '$2a$10$8K1p/5w6QyT1Vz2v9zXcOeJcQw9dJcQw9dJcQw9dJcQw9dJcQw9d', 'Administrator', 'admin')
-- ON CONFLICT (email) DO NOTHING;