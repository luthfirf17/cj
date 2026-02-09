const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'catatjasamu-postgres-dev',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'catat_jasamu_db'
});

async function restoreUserData() {
  try {
    console.log('📂 Reading backup file...');
    const backupData = JSON.parse(
      fs.readFileSync('/app/backup.json', 'utf8')
    );

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Find user with email luthfirizky602@gmail.com in backup (ID 3)
      const oldUser = backupData.data.users.find(u => u.email === 'luthfirizky602@gmail.com');
      if (!oldUser) {
        console.log('❌ User not found in backup');
        return;
      }

      console.log(`✅ Found user in backup with ID ${oldUser.id}`);

      // Current user ID in database is 1
      const currentUserId = 1;
      const oldUserId = oldUser.id;

      console.log(`🔄 Mapping user ID ${oldUserId} -> ${currentUserId}`);

      // Restore clients
      if (backupData.data.clients) {
        const userClients = backupData.data.clients.filter(c => c.user_id === oldUserId);
        console.log(`\n📋 Restoring ${userClients.length} clients...`);
        
        for (const client_data of userClients) {
          await client.query(
            `INSERT INTO clients (id, user_id, name, phone, country_code, address, email, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, name = $3, phone = $4, country_code = $5, 
               address = $6, email = $7, updated_at = $9`,
            [client_data.id, currentUserId, client_data.name, client_data.phone, 
             client_data.country_code, client_data.address, client_data.email,
             client_data.created_at, client_data.updated_at]
          );
        }
        console.log(`✅ Restored ${userClients.length} clients`);
      }

      // Restore services
      if (backupData.data.services) {
        const userServices = backupData.data.services.filter(s => s.user_id === oldUserId);
        console.log(`\n🛠️  Restoring ${userServices.length} services...`);
        
        for (const service of userServices) {
          await client.query(
            `INSERT INTO services (id, user_id, name, description, price, duration, is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, name = $3, description = $4, price = $5,
               duration = $6, is_active = $7, updated_at = $9`,
            [service.id, currentUserId, service.name, service.description, 
             service.price, service.duration, service.is_active,
             service.created_at, service.updated_at]
          );
        }
        console.log(`✅ Restored ${userServices.length} services`);
      }

      // Restore bookings
      if (backupData.data.bookings) {
        const userBookings = backupData.data.bookings.filter(b => b.user_id === oldUserId);
        console.log(`\n📅 Restoring ${userBookings.length} bookings...`);
        
        for (const booking of userBookings) {
          await client.query(
            `INSERT INTO bookings (id, user_id, client_id, service_id, booking_date, booking_date_end,
             booking_time, booking_time_end, location_name, location_map_url, status, notes, 
             created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, client_id = $3, service_id = $4, booking_date = $5,
               booking_date_end = $6, booking_time = $7, booking_time_end = $8,
               location_name = $9, location_map_url = $10, status = $11, notes = $12, updated_at = $14`,
            [booking.id, currentUserId, booking.client_id, booking.service_id,
             booking.booking_date, booking.booking_date_end, booking.booking_time,
             booking.booking_time_end, booking.location_name, booking.location_map_url,
             booking.status, booking.notes, booking.created_at, booking.updated_at]
          );
        }
        console.log(`✅ Restored ${userBookings.length} bookings`);
      }

      // Restore expenses
      if (backupData.data.expenses) {
        const userExpenses = backupData.data.expenses.filter(e => e.user_id === oldUserId);
        console.log(`\n💰 Restoring ${userExpenses.length} expenses...`);
        
        for (const expense of userExpenses) {
          await client.query(
            `INSERT INTO expenses (id, user_id, category_id, amount, expense_date, description, 
             receipt_url, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, category_id = $3, amount = $4, expense_date = $5,
               description = $6, receipt_url = $7, updated_at = $9`,
            [expense.id, currentUserId, expense.category_id, expense.amount,
             expense.expense_date, expense.description, expense.receipt_url,
             expense.created_at, expense.updated_at]
          );
        }
        console.log(`✅ Restored ${userExpenses.length} expenses`);
      }

      // Restore expense_categories
      if (backupData.data.expense_categories) {
        const userCategories = backupData.data.expense_categories.filter(c => c.user_id === oldUserId);
        console.log(`\n📁 Restoring ${userCategories.length} expense categories...`);
        
        for (const category of userCategories) {
          await client.query(
            `INSERT INTO expense_categories (id, user_id, name, description, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, name = $3, description = $4, updated_at = $6`,
            [category.id, currentUserId, category.name, category.description,
             category.created_at, category.updated_at]
          );
        }
        console.log(`✅ Restored ${userCategories.length} expense categories`);
      }

      // Update user full_name from backup
      await client.query(
        `UPDATE users SET full_name = $1, phone = $2, updated_at = NOW() WHERE id = $3`,
        [oldUser.full_name, oldUser.phone, currentUserId]
      );
      console.log(`\n✅ Updated user profile`);

      await client.query('COMMIT');
      console.log('\n🎉 Data restoration completed successfully!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Error restoring data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

restoreUserData();
