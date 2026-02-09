const { Client } = require('pg');

// Test script to check booking_names table data
async function testBookingNamesData() {
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

    // Check table structure
    console.log('\n=== TABLE STRUCTURE ===');
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'booking_names'
      ORDER BY ordinal_position;
    `;
    const structure = await client.query(structureQuery);
    console.table(structure.rows);

    // Check if data exists
    console.log('\n=== SAMPLE DATA ===');
    const dataQuery = 'SELECT * FROM booking_names LIMIT 5';
    const data = await client.query(dataQuery);
    console.log('Number of rows:', data.rows.length);
    if (data.rows.length > 0) {
      console.log('Sample row:');
      console.log(JSON.stringify(data.rows[0], null, 2));
    }

    // Check specific fields
    console.log('\n=== FIELD CHECK ===');
    const fieldQuery = 'SELECT id, name, created_at, updated_at FROM booking_names LIMIT 3';
    const fields = await client.query(fieldQuery);
    fields.rows.forEach((row, index) => {
      console.log(`Row ${index + 1}:`, {
        id: row.id,
        name: row.name,
        created_at: row.created_at,
        updated_at: row.updated_at,
        has_updated_at: row.updated_at !== null
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

testBookingNamesData();