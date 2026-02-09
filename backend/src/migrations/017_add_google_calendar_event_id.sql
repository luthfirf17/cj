-- Migration: Add Google Calendar Event ID column to bookings table
-- This stores the Google Calendar event ID to enable update/delete sync

-- Add google_calendar_event_id column
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(255) DEFAULT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_google_calendar_event_id 
ON bookings(google_calendar_event_id);

-- Add comment
COMMENT ON COLUMN bookings.google_calendar_event_id IS 
'Google Calendar event ID for synced events. Used to update or delete calendar events when booking changes.';
