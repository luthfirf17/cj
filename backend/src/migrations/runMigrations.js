const { pool, query } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Function to run a SQL file
async function runMigration(filename) {
  try {
    console.log(`\n📄 Running migration: ${filename}...`);
    
    const filePath = path.join(__dirname, filename);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    await query(sql);
    
    console.log(`✅ Migration ${filename} completed successfully`);
  } catch (error) {
    console.error(`❌ Error running migration ${filename}:`, error.message);
    throw error;
  }
}

// Main migration function
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Check if database connection is working
    await query('SELECT NOW()');
    console.log('✅ Database connection successful\n');
    
    // Run migrations in order
    await runMigration('001_create_tables.sql');
    await runMigration('002_seed_data.sql');
    
    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📊 Database is ready to use.');
    
    // Display summary
    const usersCount = await query('SELECT COUNT(*) FROM users');
    const clientsCount = await query('SELECT COUNT(*) FROM clients');
    const servicesCount = await query('SELECT COUNT(*) FROM services');
    const bookingsCount = await query('SELECT COUNT(*) FROM bookings');
    
    console.log('\n📈 Database Summary:');
    console.log(`   - Users: ${usersCount.rows[0].count}`);
    console.log(`   - Clients: ${clientsCount.rows[0].count}`);
    console.log(`   - Services: ${servicesCount.rows[0].count}`);
    console.log(`   - Bookings: ${bookingsCount.rows[0].count}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();
