const { query } = require('./backend/src/config/database');

async function testDB() {
  try {
    console.log('Testing database connection...');
    const result = await query('SELECT 1 as test');
    console.log('✅ Database connection successful:', result.rows[0]);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testDB();