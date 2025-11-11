const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'catat_jasamu_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
});

async function createCompanySettingsTable() {
  const client = await pool.connect();
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS company_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company_name VARCHAR(255) NOT NULL,
        company_address TEXT NOT NULL,
        company_phone VARCHAR(50) NOT NULL,
        company_email VARCHAR(255) NOT NULL,
        company_logo_url TEXT,
        bank_name VARCHAR(100),
        account_number VARCHAR(50),
        account_holder_name VARCHAR(255),
        payment_instructions TEXT,
        bank_name_alt VARCHAR(100),
        account_number_alt VARCHAR(50),
        account_holder_name_alt VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);
    `;
    
    await client.query(query);
    console.log('✅ Table company_settings created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createCompanySettingsTable();
