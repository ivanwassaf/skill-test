/**
 * Test database connection from app
 */

const { db } = require('./src/config');
const argon2 = require('argon2');

async function testDB() {
  const client = await db.connect();
  try {
    console.log('\n=== Database Connection Test ===\n');
    
    // Test connection
    const testResult = await client.query('SELECT NOW()');
    console.log('✓ Database connected');
    console.log('Current time:', testResult.rows[0].now);
    
    // Find user
    const username = 'admin@test.com';
    const password = 'Test@1234';
    
    console.log('\n=== Finding User ===');
    console.log('Looking for:', username);
    
    const { rows } = await client.query("SELECT * FROM users WHERE email = $1", [username]);
    console.log('Found users:', rows.length);
    
    if (rows.length === 0) {
      console.log('✗ User NOT found in database');
      
      // List all users
      const allUsers = await client.query("SELECT id, email FROM users ORDER BY id");
      console.log('\nAll users in database:');
      allUsers.rows.forEach(u => console.log(`  - ID ${u.id}: ${u.email}`));
      
      return;
    }
    
    const user = rows[0];
    console.log('✓ User found:', { id: user.id, name: user.name, email: user.email });
    console.log('is_active:', user.is_active);
    console.log('is_email_verified:', user.is_email_verified);
    console.log('Password hash (first 50 chars):', user.password.substring(0, 50));
    
    // Test password
    const isValid = await argon2.verify(user.password, password);
    console.log('\nPassword verification:', isValid ? '✓ VALID' : '✗ INVALID');
    
  } catch (err) {
    console.error('\n✗ Error:', err.message);
    console.error('Stack:', err.stack);
  } finally {
    client.release();
    await db.end();
  }
  
  process.exit(0);
}

testDB();
