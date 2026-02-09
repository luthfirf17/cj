const axios = require('axios');

// Test set-pin endpoint for Google OAuth user
async function testSetPin() {
  try {
    console.log('Testing set-pin endpoint for Google OAuth user...');

    // First, let's check if we can get a JWT token by simulating login
    // For testing purposes, we'll assume we have a valid token
    // In real scenario, you'd get this from login response

    const testPayload = {
      pin: '123456'
      // Note: No currentPassword field for Google OAuth users
    };

    console.log('Sending payload:', testPayload);

    // This will fail without proper JWT token, but we can see the logic
    const response = await axios.post('http://localhost:5001/api/user/set-pin', testPayload, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_JWT_TOKEN' // Would need real token
      }
    });

    console.log('Response:', response.data);

  } catch (error) {
    console.log('Error (expected without auth):', error.response?.data || error.message);

    // Check if it's the expected auth error vs password error
    if (error.response?.status === 401) {
      console.log('✅ Got auth error (expected without JWT token)');
    } else if (error.response?.data?.message === 'Password saat ini diperlukan untuk keamanan') {
      console.log('❌ Still getting password required error - fix not working');
    } else {
      console.log('ℹ️  Got different error:', error.response?.data?.message);
    }
  }
}

testSetPin();