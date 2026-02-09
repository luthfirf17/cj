const { Client } = require('pg');

// Test script to verify booking update with booking_name directly in database
async function testBookingUpdateDirect() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'catat_jasamu_db'
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get a booking to update
    const getBookingQuery = `
      SELECT id, booking_name, booking_date, booking_time, location_name, status, total_price, notes
      FROM bookings
      WHERE user_id = (SELECT id FROM users LIMIT 1)
      LIMIT 1
    `;

    const bookingResult = await client.query(getBookingQuery);

    if (bookingResult.rows.length === 0) {
      console.log('No bookings found to test with');
      return;
    }

    const booking = bookingResult.rows[0];
    console.log('Original booking:', {
      id: booking.id,
      booking_name: booking.booking_name
    });

    // Update the booking with a new booking_name
    const testBookingName = `Test Booking ${Date.now()}`;
    const updateQuery = `
      UPDATE bookings
      SET booking_name = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, booking_name
    `;

    const updateResult = await client.query(updateQuery, [testBookingName, booking.id]);

    console.log('Update result:', updateResult.rows[0]);

    // Verify the update
    const verifyQuery = 'SELECT id, booking_name FROM bookings WHERE id = $1';
    const verifyResult = await client.query(verifyQuery, [booking.id]);

    console.log('Verified booking after update:', verifyResult.rows[0]);

    if (verifyResult.rows[0].booking_name === testBookingName) {
      console.log('✅ SUCCESS: Booking name was updated correctly in database!');
    } else {
      console.log('❌ FAILED: Booking name was not updated. Expected:', testBookingName, 'Got:', verifyResult.rows[0].booking_name);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await client.end();
  }
}

testBookingUpdateDirect();