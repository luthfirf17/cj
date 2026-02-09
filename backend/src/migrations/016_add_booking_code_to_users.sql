-- Add booking_code column to users table for unique public booking links
-- Each user gets a unique 16-character hash for their booking page

-- Add booking_code column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS booking_code VARCHAR(32) UNIQUE;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_booking_code ON users(booking_code);

-- Function to generate random booking code
CREATE OR REPLACE FUNCTION generate_booking_code() RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
    result TEXT := '';
    i INTEGER;
    code_exists BOOLEAN;
BEGIN
    LOOP
        result := '';
        FOR i IN 1..16 LOOP
            result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM users WHERE booking_code = result) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Generate booking codes for existing users who don't have one
UPDATE users 
SET booking_code = generate_booking_code() 
WHERE booking_code IS NULL;

-- Add NOT NULL constraint after populating existing rows
ALTER TABLE users 
ALTER COLUMN booking_code SET NOT NULL;

-- Add trigger to auto-generate booking_code for new users
CREATE OR REPLACE FUNCTION auto_generate_booking_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.booking_code IS NULL THEN
        NEW.booking_code := generate_booking_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_booking_code ON users;
CREATE TRIGGER trigger_auto_booking_code
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_booking_code();

COMMENT ON COLUMN users.booking_code IS 'Unique 16-character code for public booking link (e.g., yourdomain.com/booking/a7f3k9m2p5w8x1q4)';
