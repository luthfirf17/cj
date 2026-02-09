const axios = require('axios');

// Test script to verify booking update with booking_name
async function testBookingUpdate() {
  try {
    // First, get a booking to update
    const getResponse = await axios.get('http://localhost:3000/api/user/bookings', {
      headers: {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
      }
    });

    if (getResponse.data.bookings && getResponse.data.bookings.length > 0) {
      const booking = getResponse.data.bookings[0];
      console.log('Original booking:', {
        id: booking.id,
        booking_name: booking.booking_name
      });

      // Update the booking with a new booking_name
      const testBookingName = `Test Booking ${Date.now()}`;
      const updateResponse = await axios.put(`http://localhost:3000/api/user/bookings/${booking.id}`, {
        booking_name: testBookingName,
        service_id: booking.service_id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        location_name: booking.location_name,
        status: booking.status,
        total_amount: booking.total_price,
        amount_paid: booking.amount_paid || 0,
        notes: booking.notes
      }, {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        }
      });

      console.log('Update response:', updateResponse.data);

      // Verify the update by fetching the booking again
      const verifyResponse = await axios.get(`http://localhost:3000/api/user/bookings/${booking.id}`, {
        headers: {
          'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Replace with actual token
        }
      });

      console.log('Verified booking after update:', {
        id: verifyResponse.data.booking.id,
        booking_name: verifyResponse.data.booking.booking_name
      });

      if (verifyResponse.data.booking.booking_name === testBookingName) {
        console.log('✅ SUCCESS: Booking name was updated correctly!');
      } else {
        console.log('❌ FAILED: Booking name was not updated. Expected:', testBookingName, 'Got:', verifyResponse.data.booking.booking_name);
      }
    } else {
      console.log('No bookings found to test with');
    }
  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
  }
}

testBookingUpdate();