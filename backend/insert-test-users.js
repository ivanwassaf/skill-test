require('dotenv').config();
const { db } = require('./src/config');

async function insertTestUsers() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    
    // Delete existing test users
    await client.query("DELETE FROM user_refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@test.com', 'student@test.com'))");
    await client.query("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE email IN ('admin@test.com', 'student@test.com'))");
    await client.query("DELETE FROM users WHERE email IN ('admin@test.com', 'student@test.com')");
    
    // Insert admin user
    const adminResult = await client.query(`
      INSERT INTO users (id, name, email, password, role_id, is_active, is_email_verified, created_dt, updated_dt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        is_active = EXCLUDED.is_active
      RETURNING id, name, email
    `, [999999, 'Test Admin', 'admin@test.com', '$argon2id$v=19$m=65536,t=3,p=4$F650/gq9DlQTftTgdDjBAA$5rMl/V4i4DtMdLWKoJmKfJGzlZf/6VBOU4NhlRzGgAo', 1, true, true]);
    console.log('✓ Inserted admin:', adminResult.rows[0]);
    
    // Insert admin profile
    await client.query(`
      INSERT INTO user_profiles (user_id, phone, current_address, created_dt, updated_dt)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone
    `, [999999, '+1234567890', 'Test Address']);
    
    // Insert student user
    const studentResult = await client.query(`
      INSERT INTO users (id, name, email, password, role_id, is_active, is_email_verified, created_dt, updated_dt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        is_active = EXCLUDED.is_active
      RETURNING id, name, email
    `, [999998, 'Test Student', 'student@test.com', '$argon2id$v=19$m=65536,t=3,p=4$F650/gq9DlQTftTgdDjBAA$5rMl/V4i4DtMdLWKoJmKfJGzlZf/6VBOU4NhlRzGgAo', 3, true, true]);
    console.log('✓ Inserted student:', studentResult.rows[0]);
    
    // Insert student profile
    await client.query(`
      INSERT INTO user_profiles (user_id, phone, current_address, class_name, section_name, roll, created_dt, updated_dt)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone
    `, [999998, '+1234567891', 'Student Address', 'Class 1', 'Section 1', 1]);
    
    await client.query('COMMIT');
    console.log('\n✓ Test users inserted successfully!');
    
    // Verify
    const verify = await client.query("SELECT id, name, email, is_active FROM users WHERE id IN (999998, 999999) ORDER BY id");
    console.log('\nVerification:');
    verify.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Active: ${user.is_active}`);
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err.message);
  } finally {
    client.release();
    await db.end();
  }
}

insertTestUsers();
