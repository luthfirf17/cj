// Simple Node.js script to backup database data to JSON
// Run from backend directory: node ../backup-data-nodejs.js
const { Pool } = require('./backend/node_modules/pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'catat_jasamu_db',
  user: 'postgres',
  password: '1234', // From backend/.env
});

async function backupDatabase() {
  console.log('🔄 Starting database backup...');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const backup = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      database: 'catat_jasamu_db',
      data: {}
    };

    // Backup users (exclude sensitive data like passwords and PIN)
    console.log('📊 Backing up users...');
    const users = await pool.query('SELECT id, email, full_name, phone, role, is_active, avatar_url, created_at, updated_at FROM users');
    backup.data.users = users.rows;
    console.log(`   ✅ ${users.rows.length} users backed up`);

    // Backup company_settings
    console.log('🏢 Backing up company settings...');
    const companySettings = await pool.query('SELECT * FROM company_settings');
    backup.data.companySettings = companySettings.rows;
    console.log(`   ✅ ${companySettings.rows.length} company settings backed up`);

    // Backup clients
    console.log('👥 Backing up clients...');
    const clients = await pool.query('SELECT * FROM clients ORDER BY id');
    backup.data.clients = clients.rows;
    console.log(`   ✅ ${clients.rows.length} clients backed up`);

    // Backup services
    console.log('🛠️  Backing up services...');
    const services = await pool.query('SELECT * FROM services ORDER BY id');
    backup.data.services = services.rows;
    console.log(`   ✅ ${services.rows.length} services backed up`);

    // Backup bookings
    console.log('📅 Backing up bookings...');
    const bookings = await pool.query('SELECT * FROM bookings ORDER BY id');
    backup.data.bookings = bookings.rows;
    console.log(`   ✅ ${bookings.rows.length} bookings backed up`);

    // Backup payments
    console.log('💰 Backing up payments...');
    const payments = await pool.query('SELECT * FROM payments ORDER BY id');
    backup.data.payments = payments.rows;
    console.log(`   ✅ ${payments.rows.length} payments backed up`);

    // Backup expense_categories
    console.log('📂 Backing up expense categories...');
    const expenseCategories = await pool.query('SELECT * FROM expense_categories ORDER BY id');
    backup.data.expenseCategories = expenseCategories.rows;
    console.log(`   ✅ ${expenseCategories.rows.length} expense categories backed up`);

    // Backup expenses
    console.log('💸 Backing up expenses...');
    const expenses = await pool.query('SELECT * FROM expenses ORDER BY id');
    backup.data.expenses = expenses.rows;
    console.log(`   ✅ ${expenses.rows.length} expenses backed up`);

    // Save to file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const backupDir = path.join(__dirname, 'database_backups');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `complete_backup_${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backup, null, 2));

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Backup completed successfully!');
    console.log(`\n📁 Backup saved to: ${filepath}`);
    console.log(`📦 File size: ${(fs.statSync(filepath).size / 1024).toFixed(2)} KB`);
    console.log('\n📋 Summary:');
    console.log(`   - Users: ${backup.data.users.length}`);
    console.log(`   - Company Settings: ${backup.data.companySettings.length}`);
    console.log(`   - Clients: ${backup.data.clients.length}`);
    console.log(`   - Services: ${backup.data.services.length}`);
    console.log(`   - Bookings: ${backup.data.bookings.length}`);
    console.log(`   - Payments: ${backup.data.payments.length}`);
    console.log(`   - Expense Categories: ${backup.data.expenseCategories.length}`);
    console.log(`   - Expenses: ${backup.data.expenses.length}`);
    console.log('\n💡 Tip: Copy this file to your new device!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error during backup:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

backupDatabase();
