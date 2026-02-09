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
    console.log(`Running migration: ${migrationFile}`);

    // Read migration file
    const migrationPath = path.join(__dirname, migrationFile);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL commands and execute them
    const commands = migrationSQL.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        console.log(`Executing: ${command.trim().substring(0, 50)}...`);
        await client.query(command);
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error running migration:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('Usage: node run_migration_sql.js <migration_file.sql>');
  process.exit(1);
}

runMigration(migrationFile);