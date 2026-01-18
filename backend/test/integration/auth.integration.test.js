const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../src/app');

describe('Auth Integration Tests', function () {
  this.timeout(10000);

  let authToken;
  let refreshToken;
  let csrfToken;

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.have.property('accessToken');
      expect(res.body.data).to.have.property('user');
      expect(res.body.data.user).to.have.property('email', 'admin@test.com');

      // Store tokens for subsequent tests
      authToken = res.body.data.accessToken;
      
      // Extract refresh token from cookie
      const cookies = res.headers['set-cookie'];
      if (cookies) {
        const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
        if (refreshCookie) {
          refreshToken = refreshCookie.split(';')[0].split('=')[1];
        }
      }
    });

    it('should fail login with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'nonexistent@test.com',
          password: 'Test@1234'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
    });

    it('should fail login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'WrongPassword123'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(res.body).to.have.property('success', false);
    });

    it('should fail login with missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'Test@1234'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body).to.have.property('success', false);
    });

    it('should fail login with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'invalid-email',
          password: 'Test@1234'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(res.body).to.have.property('success', false);
    });
  });

  describe('GET /api/v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // First login to get a refresh token
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        });

      const cookies = loginRes.headers['set-cookie'];
      
      const res = await request(app)
        .get('/api/v1/auth/refresh')
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('accessToken');
    });

    it('should fail refresh without refresh token cookie', async () => {
      await request(app)
        .get('/api/v1/auth/refresh')
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      // First login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        });

      const token = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'];

      const res = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
    });

    it('should fail logout without authentication', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full login -> access protected resource -> logout flow', async () => {
      // Step 1: Login
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        })
        .expect(200);

      const token = loginRes.body.data.accessToken;
      const cookies = loginRes.headers['set-cookie'];

      // Step 2: Access protected resource (dashboard)
      const dashboardRes = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(dashboardRes.body).to.have.property('success', true);

      // Step 3: Logout
      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(logoutRes.body).to.have.property('success', true);

      // Step 4: Try to access protected resource after logout (should fail)
      await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${token}`)
        .set('Cookie', cookies)
        .expect(401);
    });
  });
});
