-- Add location fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS location_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS location_map_url TEXT;

-- Add index for location_name for faster searching
CREATE INDEX IF NOT EXISTS idx_bookings_location_name ON bookings(location_name);

-- Add comment
COMMENT ON COLUMN bookings.location_name IS 'Nama lokasi booking (wajib)';
COMMENT ON COLUMN bookings.location_map_url IS 'Link Google Maps lokasi (opsional)';
