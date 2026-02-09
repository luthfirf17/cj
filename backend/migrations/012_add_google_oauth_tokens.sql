-- Migration: 012_add_google_oauth_tokens.sql
-- Description: Add Google OAuth token fields to users table for Google Calendar API
-- Date: 2025-01-27

-- Add Google OAuth token fields to users table
ALTER TABLE users
ADD COLUMN google_access_token TEXT,
ADD COLUMN google_refresh_token TEXT,
ADD COLUMN google_token_expiry TIMESTAMP;

-- Add index for token expiry for cleanup queries
CREATE INDEX idx_users_google_token_expiry ON users(google_token_expiry);

-- Add comments to columns
COMMENT ON COLUMN users.google_access_token IS 'Google OAuth access token for API calls';
COMMENT ON COLUMN users.google_refresh_token IS 'Google OAuth refresh token for renewing access';
COMMENT ON COLUMN users.google_token_expiry IS 'Expiry date of the access token';