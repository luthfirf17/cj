-- Migration: Add Google OAuth tokens to users table
-- Date: 2025-11-28

-- Add Google OAuth token columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'email',
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS google_access_token TEXT,
ADD COLUMN IF NOT EXISTS google_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Create index for Google ID for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider);

-- Update existing users to have 'email' provider if they don't have one
UPDATE users SET provider = 'email' WHERE provider IS NULL;