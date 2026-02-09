const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');

async function testPassword() {
  try {
    const result = await pool.query('SELECT password FROM users WHERE email = $1', ['admin@cataljasamu.com']);
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }

    const hashedPassword = result.rows[0].password;
    console.log('Hashed password exists:', !!hashedPassword);
    console.log('Hashed password length:', hashedPassword ? hashedPassword.length : 0);

    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    console.log('Password valid:', isValid);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

testPassword();