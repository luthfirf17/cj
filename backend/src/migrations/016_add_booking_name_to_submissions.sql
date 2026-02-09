-- Migration: 016_add_booking_name_to_submissions.sql
-- Description: Add booking_name column to client_submissions table
-- Date: 2026-02-04

-- Add booking_name column to client_submissions
ALTER TABLE client_submissions 
ADD COLUMN IF NOT EXISTS booking_name VARCHAR(255);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_client_submissions_booking_name ON client_submissions(booking_name);

-- Add comment
COMMENT ON COLUMN client_submissions.booking_name IS 'Name/title of the booking event (e.g., "Wedding John & Mary", "Company Anniversary")';
