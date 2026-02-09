-- Migration: Add booking_name column to bookings table
-- Date: 2026-01-27
-- Description: Add booking_name column to store custom booking names

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_name VARCHAR(255);