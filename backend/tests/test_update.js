const { pool } = require('./src/config/database');

async function testUpdate() {
  const client = await pool.connect();
  try {
    console.log('Testing UPDATE query...');
    await client.query('UPDATE users SET updated_at = NOW() WHERE id = $1', [7]);
    console.log('UPDATE query successful');
  } catch (err) {
    console.error('UPDATE error:', err);
  } finally {
    client.release();
  }
}

testUpdate();