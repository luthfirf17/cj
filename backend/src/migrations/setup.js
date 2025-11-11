const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // First, connect to postgres database to create our database
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database first
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('🔌 Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✅ Connected to PostgreSQL server\n');

    // Check if database exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    const dbName = process.env.DB_NAME || 'catat_jasamu_db';
    const result = await client.query(checkDbQuery, [dbName]);

    if (result.rows.length === 0) {
      console.log(`📦 Creating database: ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log('✅ Database created successfully!\n');
    } else {
      console.log(`✅ Database '${dbName}' already exists\n`);
    }

    await client.end();

    // Now run migrations on the new database
    console.log('🚀 Running migrations...\n');
    await runMigrationsOnDatabase();

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Cannot connect to PostgreSQL server.');
      console.error('Please check:');
      console.error('  1. PostgreSQL server is running');
      console.error('  2. Host and port are correct in .env file');
      console.error('  3. Username and password are correct');
    } else if (error.code === '28P01') {
      console.error('\n⚠️  Authentication failed.');
      console.error('Please check DB_USER and DB_PASSWORD in .env file');
    }
    
    process.exit(1);
  }
}

async function runMigrationsOnDatabase() {
  const { pool, query } = require('../config/database');
  
  try {
    // Test connection to the new database
    await query('SELECT NOW()');
    console.log('✅ Connected to catat_jasamu_db\n');
    
    // Run migrations
    const migrations = [
      '001_create_tables.sql',
      '002_seed_data.sql'
    ];
    
    for (const filename of migrations) {
      console.log(`📄 Running migration: ${filename}...`);
      
      const filePath = path.join(__dirname, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      await query(sql);
      
      console.log(`✅ Migration ${filename} completed successfully\n`);
    }
    
    // Display summary
    const usersCount = await query('SELECT COUNT(*) FROM users');
    const clientsCount = await query('SELECT COUNT(*) FROM clients');
    const servicesCount = await query('SELECT COUNT(*) FROM services');
    const bookingsCount = await query('SELECT COUNT(*) FROM bookings');
    
    console.log('✅ All migrations completed successfully!\n');
    console.log('📊 Database Summary:');
    console.log(`   - Users: ${usersCount.rows[0].count}`);
    console.log(`   - Clients: ${clientsCount.rows[0].count}`);
    console.log(`   - Services: ${servicesCount.rows[0].count}`);
    console.log(`   - Bookings: ${bookingsCount.rows[0].count}`);
    console.log('\n🎉 Database setup complete! You can now start the server.\n');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error running migrations:', error.message);
    process.exit(1);
  }
}

setupDatabase();
