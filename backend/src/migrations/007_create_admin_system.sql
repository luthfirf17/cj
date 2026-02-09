-- Migration: Create Admin System
-- Description: Add admin role and features to existing users table

-- Add role column to users table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user';
    END IF;
END $$;

-- Add is_active column for user management
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add last_login column for tracking
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
    END IF;
END $$;

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
-- Security PIN: 000000 (will be prompted to change on first login)
INSERT INTO users (username, full_name, email, password, role, security_pin, phone, is_active, created_at, updated_at)
VALUES (
  'admin',
  'Super Admin',
  'admin@cataljasamu.com',
  '$2b$10$2oD.yB6RkAnjtlE7hzua..I0wQJlE8vR.R8A7gIQla0XTcLNT/Nem', -- bcrypt hash for 'admin123'
  'admin',
  '000000',
  '081234567890',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Create index for role lookup
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

COMMENT ON COLUMN users.role IS 'User role: admin or user';
COMMENT ON COLUMN users.is_active IS 'Whether user account is active';
COMMENT ON COLUMN users.last_login IS 'Last login timestamp';
