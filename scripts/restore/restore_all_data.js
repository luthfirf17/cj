const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'catatjasamu-postgres',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'catat_jasamu_db'
});

async function restoreAllData() {
  try {
    console.log('📂 Reading backup file...');
    const backupData = JSON.parse(
      fs.readFileSync('/tmp/complete_backup_2025-11-08T15-25-34.json', 'utf8')
    );

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Restore users
      if (backupData.data.users) {
        console.log(`👥 Restoring ${backupData.data.users.length} users...`);
        
        for (const user of backupData.data.users) {
          await client.query(
            `INSERT INTO users (id, username, email, password, full_name, phone, role, is_active, security_pin, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (id) DO UPDATE SET
               username = $2, email = $3, password = $4, full_name = $5, phone = $6, 
               role = $7, is_active = $8, security_pin = $9, updated_at = $11`,
            [
              user.id,
              user.username || user.email, // fallback if username not set
              user.email,
              user.password || '$2b$10$dummy.hash.for.restore', // dummy password
              user.full_name,
              user.phone,
              user.role,
              user.is_active,
              user.security_pin,
              user.created_at,
              user.updated_at
            ]
          );
        }
        console.log('✅ Users restored successfully');
      }

      // Restore clients
      if (backupData.data.clients) {
        console.log(`👥 Restoring ${backupData.data.clients.length} clients...`);
        
        for (const client of backupData.data.clients) {
          await client.query(
            `INSERT INTO clients (id, user_id, name, phone, country_code, address, email, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, name = $3, phone = $4, country_code = $5, 
               address = $6, email = $7, updated_at = $9`,
            [
              client.id,
              client.user_id,
              client.name,
              client.phone,
              client.country_code,
              client.address,
              client.email,
              client.created_at,
              client.updated_at
            ]
          );
        }
        console.log('✅ Clients restored successfully');
      }

      // Restore services
      if (backupData.data.services) {
        console.log(`🛠️ Restoring ${backupData.data.services.length} services...`);
        
        for (const service of backupData.data.services) {
          await client.query(
            `INSERT INTO services (id, user_id, name, description, price, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, name = $3, description = $4, price = $5, updated_at = $7`,
            [
              service.id,
              service.user_id,
              service.name,
              service.description,
              service.price,
              service.created_at,
              service.updated_at
            ]
          );
        }
        console.log('✅ Services restored successfully');
      }

      // Restore bookings
      if (backupData.data.bookings) {
        console.log(`📋 Restoring ${backupData.data.bookings.length} bookings...`);
        
        for (const booking of backupData.data.bookings) {
          await client.query(
            `INSERT INTO bookings (id, user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, status, total_price, notes, created_at, updated_at, booking_name)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, client_id = $3, service_id = $4, booking_date = $5, booking_time = $6,
               location_name = $7, location_map_url = $8, status = $9, total_price = $10, 
               notes = $11, updated_at = $13, booking_name = $14`,
            [
              booking.id,
              booking.user_id,
              booking.client_id,
              booking.service_id,
              booking.booking_date,
              booking.booking_time,
              booking.location_name,
              booking.location_map_url,
              booking.status,
              booking.total_price,
              booking.notes,
              booking.created_at,
              booking.updated_at,
              booking.booking_name || null
            ]
          );
        }
        console.log('✅ Bookings restored successfully');
      }

      await client.query('COMMIT');
      console.log('🎉 All data restored successfully!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  } finally {
    await pool.end();
  }
}

restoreAllData();
