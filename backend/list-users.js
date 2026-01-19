require('dotenv').config();
const { db } = require('./src/config');

async function listUsers() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const client = await db.connect();
  try {
    const result = await client.query('SELECT id, name, email FROM users ORDER BY id');
    console.log('\nTotal users:', result.rows.length);
    console.log('\nUsers:');
    result.rows.forEach(user => {
      console.log(`  - ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await db.end();
  }
}

listUsers();
