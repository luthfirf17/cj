-- Migration 015: Create booking_names table
-- This table stores saved booking names that can be reused via dropdown

CREATE TABLE IF NOT EXISTS booking_names (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name, user_id)
);

-- Create index for faster queries
CREATE INDEX idx_booking_names_user_id ON booking_names(user_id);
CREATE INDEX idx_booking_names_name ON booking_names(name);

-- Add booking_name column to bookings table (can be NULL, optional field)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS booking_name VARCHAR(255);

-- Create index for booking_name
CREATE INDEX idx_bookings_booking_name ON bookings(booking_name);
