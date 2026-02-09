-- Migration: 013_create_client_submissions.sql
-- Description: Create client_submissions table for receiving booking data from clients before user confirmation
-- Date: 2025-01-27

-- Create client_submissions table
CREATE TABLE IF NOT EXISTS client_submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Client Information (filled by client)
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_country_code VARCHAR(10) DEFAULT '62',
    client_address TEXT,
    
    -- Booking Information
    booking_date DATE NOT NULL,
    booking_date_end DATE,
    booking_time TIME,
    booking_time_end TIME,
    
    -- Location Information
    location_name VARCHAR(255),
    location_map_url TEXT,
    
    -- Services (JSON array of selected services with quantities)
    -- Format: [{ "service_id": 1, "service_name": "Service A", "quantity": 1, "custom_price": 100000 }]
    services JSONB NOT NULL DEFAULT '[]',
    
    -- Notes from client
    notes TEXT,
    
    -- Submission Status
    -- 'pending' - waiting for user confirmation
    -- 'confirmed' - user confirmed and moved to bookings table
    -- 'rejected' - user rejected the submission
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
    
    -- Rejection reason (if rejected)
    rejection_reason TEXT,
    
    -- Confirmed booking ID (if confirmed)
    confirmed_booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    rejected_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_client_submissions_user_id ON client_submissions(user_id);
CREATE INDEX idx_client_submissions_status ON client_submissions(status);
CREATE INDEX idx_client_submissions_created_at ON client_submissions(created_at DESC);
CREATE INDEX idx_client_submissions_booking_date ON client_submissions(booking_date);

-- Add comments to columns
COMMENT ON TABLE client_submissions IS 'Stores booking submissions from clients before user confirmation';
COMMENT ON COLUMN client_submissions.user_id IS 'The user (service provider) who will receive and confirm this submission';
COMMENT ON COLUMN client_submissions.client_name IS 'Name of the client who submitted the booking';
COMMENT ON COLUMN client_submissions.client_phone IS 'Phone number of the client';
COMMENT ON COLUMN client_submissions.client_country_code IS 'Country code for phone number (default: 62 for Indonesia)';
COMMENT ON COLUMN client_submissions.services IS 'JSON array of selected services with their details';
COMMENT ON COLUMN client_submissions.status IS 'Submission status: pending, confirmed, or rejected';
COMMENT ON COLUMN client_submissions.confirmed_booking_id IS 'Reference to the booking record created after confirmation';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_submissions_updated_at
    BEFORE UPDATE ON client_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_client_submissions_updated_at();
