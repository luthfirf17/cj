-- Migration: Create service_responsible_parties table
CREATE TABLE IF NOT EXISTS service_responsible_parties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    address TEXT,
    service_id INTEGER REFERENCES services(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);