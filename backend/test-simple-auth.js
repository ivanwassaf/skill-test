/**
 * Simple test to verify auth works
 */

const request = require('supertest');
const { app } = require('./src/app');

async function testAuth() {
  console.log('\n=== Testing Auth Login ===\n');
  
  try {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@test.com',
        password: 'Test@1234'
      });
    
    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.body, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  process.exit(0);
}

testAuth();
