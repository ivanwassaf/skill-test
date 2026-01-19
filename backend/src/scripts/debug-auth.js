/**
 * Debug auth login
 */

const argon2 = require('argon2');
const { Pool } = require('pg');

async function testLogin() {
  // Direct connection to avoid config issues
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'school_mgmt',
    password: 'postgres',
    port: 5432,
  });
  
  const client = await pool.connect();
  try {
    const username = 'admin@test.com';
    const password = 'Test@1234';
    
    console.log('Testing login for:', username);
    
    // Find user
    const query = "SELECT * FROM users WHERE email = $1";
    const { rows } = await client.query(query, [username]);
    const user = rows[0];
    
    if (!user) {
      console.log('✗ User not found');
      return;
    }
    
    console.log('✓ User found:', { id: user.id, name: user.name, email: user.email, is_active: user.is_active });
    console.log('Password hash from DB:', user.password.substring(0, 50) + '...');
    
    // Verify password
    const isValid = await argon2.verify(user.password, password);
    console.log('Password verification:', isValid ? '✓ Valid' : '✗ Invalid');
    
    if (!user.is_active) {
      console.log('✗ User is not active');
    } else {
      console.log('✓ User is active');
    }
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
  
  process.exit(0);
}

testLogin();
