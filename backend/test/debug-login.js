const request = require('supertest');
const { app } = require('../src/app');

// Quick test to see actual login response
(async () => {
  try {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@test.com',
        password: 'Test@1234'
      });

    console.log('Status:', res.status);
    console.log('Body:', JSON.stringify(res.body, null, 2));
    console.log('Headers:', res.headers);
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
