-- Create responsible_parties table
CREATE TABLE IF NOT EXISTS responsible_parties (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_responsible_parties_user_id ON responsible_parties(user_id);
CREATE INDEX IF NOT EXISTS idx_responsible_parties_name ON responsible_parties(name);

-- Add comments
COMMENT ON TABLE responsible_parties IS 'Tabel untuk menyimpan data penanggung jawab booking';
COMMENT ON COLUMN responsible_parties.name IS 'Nama penanggung jawab';
COMMENT ON COLUMN responsible_parties.phone IS 'Nomor telepon/WhatsApp penanggung jawab';
COMMENT ON COLUMN responsible_parties.address IS 'Alamat penanggung jawab (opsional)';