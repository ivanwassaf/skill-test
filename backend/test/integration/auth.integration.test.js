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
      // Use agent to persist cookies
      const agent = request.agent(app);
      
      // First login to get a refresh token
      await agent
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        });

      // Agent automatically sends cookies from previous request
      const res = await agent
        .get('/api/v1/auth/refresh')
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
      // Use agent to persist cookies
      const agent = request.agent(app);
      
      // First login
      const loginRes = await agent
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        });

      // Extract csrfToken from cookies (find the one with actual value, not expired)
      const cookies = loginRes.headers['set-cookie'];
      const csrfCookie = cookies.find(cookie => cookie.startsWith('csrfToken=') && !cookie.includes('1970'));
      const csrfToken = decodeURIComponent(csrfCookie.split(';')[0].split('=')[1]);

      // Agent automatically sends cookies, but we need to send CSRF header
      const res = await agent
        .post('/api/v1/auth/logout')
        .set('x-csrf-token', csrfToken)
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
      // Use agent to persist cookies
      const agent = request.agent(app);
      
      // Step 1: Login
      const loginRes = await agent
        .post('/api/v1/auth/login')
        .send({
          username: 'admin@test.com',
          password: 'Test@1234'
        })
        .expect(200);

      expect(loginRes.body).to.have.property('success', true);

      // Extract csrfToken from cookies (find the one with actual value, not expired)
      const cookies = loginRes.headers['set-cookie'];
      const csrfCookie = cookies.find(cookie => cookie.startsWith('csrfToken=') && !cookie.includes('1970'));
      const csrfToken = decodeURIComponent(csrfCookie.split(';')[0].split('=')[1]);

      // Step 2: Access protected resource (dashboard)
      const dashboardRes = await agent
        .get('/api/v1/dashboard')
        .set('x-csrf-token', csrfToken)
        .expect(200);

      // Dashboard returns data directly (not wrapped in {success, data})
      expect(dashboardRes.body).to.be.an('object');

      // Step 3: Logout
      const logoutRes = await agent
        .post('/api/v1/auth/logout')
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(logoutRes.body).to.have.property('success', true);

      // Step 4: Try to access protected resource after logout (should fail)
      await agent
        .get('/api/v1/dashboard')
        .expect(401);
    });
  });
});
