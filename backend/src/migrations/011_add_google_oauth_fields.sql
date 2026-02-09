-- Migration: 011_add_google_oauth_fields.sql
-- Description: Add Google OAuth fields to users table
-- Date: 2025-01-27

-- Add Google OAuth fields to users table
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN google_email VARCHAR(255),
ADD COLUMN avatar_url TEXT,
ADD COLUMN auth_provider VARCHAR(50) DEFAULT 'local';

-- Add index for Google ID for faster lookups
CREATE INDEX idx_users_google_id ON users(google_id);

-- Add index for auth provider
CREATE INDEX idx_users_auth_provider ON users(auth_provider);

-- Update existing records to have 'local' as default auth provider
UPDATE users SET auth_provider = 'local' WHERE auth_provider IS NULL;

-- Add comment to table
COMMENT ON COLUMN users.google_id IS 'Google OAuth unique identifier';
COMMENT ON COLUMN users.google_email IS 'Email from Google OAuth (may differ from login email)';
COMMENT ON COLUMN users.avatar_url IS 'Profile picture URL from Google OAuth';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: local, google';