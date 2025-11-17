const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'catat_jasamu_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
});

async function runMigration(migrationFile) {
  const client = await pool.connect();
  try {
    const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log(`🚀 Running migration: ${migrationFile}`);
    await client.query(sql);
    console.log(`✅ Migration ${migrationFile} completed successfully!`);
  } catch (error) {
    console.error(`❌ Error running migration ${migrationFile}:`, error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide migration file name as argument');
  console.error('Example: node run_migration_fixed.js 010_create_service_responsible_parties.sql');
  process.exit(1);
}

runMigration(migrationFile);