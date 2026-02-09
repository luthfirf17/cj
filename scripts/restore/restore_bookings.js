const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'catatjasamu-postgres',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'catat_jasamu_db'
});

async function restoreBookings() {
  try {
    console.log('📂 Reading backup file...');
    const backupData = JSON.parse(
      fs.readFileSync('/tmp/complete_backup_2025-11-08T15-25-34.json', 'utf8')
    );

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Restore bookings
      if (backupData.data.bookings) {
        console.log(`📋 Restoring ${backupData.data.bookings.length} bookings...`);
        
        for (const booking of backupData.data.bookings) {
          await client.query(
            `INSERT INTO bookings (id, user_id, client_id, service_id, booking_date, booking_time, location_name, location_map_url, status, total_price, notes, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET
               user_id = $2, client_id = $3, service_id = $4, booking_date = $5, booking_time = $6,
               location_name = $7, location_map_url = $8, status = $9, total_price = $10, 
               notes = $11, updated_at = $13`,
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
              booking.updated_at
            ]
          );
        }
        console.log('✅ Bookings restored successfully');
      }

      await client.query('COMMIT');
      console.log('🎉 Restore completed successfully!');
      
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

restoreBookings();
