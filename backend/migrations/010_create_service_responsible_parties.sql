-- Migration: Create service_responsible_parties table
-- Fixed: This should be a junction table linking services to responsible parties
DROP TABLE IF EXISTS service_responsible_parties;

CREATE TABLE IF NOT EXISTS service_responsible_parties (
    id SERIAL PRIMARY KEY,
    service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    responsible_party_id INTEGER NOT NULL REFERENCES responsible_parties(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_responsible_parties_service_id ON service_responsible_parties(service_id);
CREATE INDEX IF NOT EXISTS idx_service_responsible_parties_responsible_party_id ON service_responsible_parties(responsible_party_id);

-- Add unique constraint to prevent duplicate associations
ALTER TABLE service_responsible_parties ADD CONSTRAINT unique_service_responsible_party UNIQUE (service_id, responsible_party_id);