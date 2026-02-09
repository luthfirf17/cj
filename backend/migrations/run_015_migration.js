const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'catat_jasamu_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running migration 015: Create booking_names table...');
    
    // Create booking_names table
    await client.query(`
      CREATE TABLE IF NOT EXISTS booking_names (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(name, user_id)
      );
    `);
    console.log('✅ Created booking_names table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_names_user_id ON booking_names(user_id);
    `);
    console.log('✅ Created index on user_id');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_booking_names_name ON booking_names(name);
    `);
    console.log('✅ Created index on name');

    // Add booking_name column to bookings table
    await client.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS booking_name VARCHAR(255);
    `);
    console.log('✅ Added booking_name column to bookings table');

    // Create index for booking_name
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_booking_name ON bookings(booking_name);
    `);
    console.log('✅ Created index on booking_name');

    console.log('🎉 Migration 015 completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
