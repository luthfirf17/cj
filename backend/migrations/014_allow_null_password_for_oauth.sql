-- Migration: 014_allow_null_password_for_oauth.sql
-- Description: Allow null password for OAuth users (Google login)
-- Date: 2026-01-23

-- Make password column nullable to support OAuth users who don't have passwords
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;

-- Add comment to explain the change
COMMENT ON COLUMN users.password IS 'User password hash. Can be NULL for OAuth users (Google, etc.)';
