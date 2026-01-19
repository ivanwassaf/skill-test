const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Authentication Flow
 * Tests complete user authentication journey
 */

test.describe('Authentication E2E Flow', () => {
  const baseURL = 'http://localhost:5007';
  let accessToken;
  let csrfToken;

  test.beforeAll(async () => {
    // Get CSRF token
    const response = await fetch(`${baseURL}/api/v1/auth/csrf-token`);
    const data = await response.json();
    csrfToken = data.csrfToken;
  });

  test('should complete full authentication flow', async ({ request }) => {
    // Step 1: Login
    const loginResponse = await request.post(`${baseURL}/api/v1/auth/login`, {
      headers: {
        'Content-Type': 'application/json',
        'x-secret-header': 'secret',
      },
      data: {
        email: 'ben@gmail.com',
        password: 'Password@123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    expect(loginData.success).toBe(true);
    expect(loginData.data).toHaveProperty('accessToken');
    
    accessToken = loginData.data.accessToken;
    const cookies = loginResponse.headers()['set-cookie'];
    expect(cookies).toBeTruthy();

    // Step 2: Access protected resource
    const dashboardResponse = await request.get(`${baseURL}/api/v1/dashboard`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(dashboardResponse.ok()).toBeTruthy();
    const dashboardData = await dashboardResponse.json();
    expect(dashboardData.success).toBe(true);

    // Step 3: Refresh token
    const refreshResponse = await request.get(`${baseURL}/api/v1/auth/refresh`, {
      headers: {
        'Cookie': cookies,
        'x-secret-header': 'secret',
      },
    });

    expect(refreshResponse.ok()).toBeTruthy();
    const refreshData = await refreshResponse.json();
    expect(refreshData.success).toBe(true);
    expect(refreshData.data).toHaveProperty('accessToken');

    // Step 4: Logout
    const logoutResponse = await request.post(`${baseURL}/api/v1/auth/logout`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(logoutResponse.ok()).toBeTruthy();
    const logoutData = await logoutResponse.json();
    expect(logoutData.success).toBe(true);

    // Step 5: Verify cannot access protected resource after logout
    const unauthorizedResponse = await request.get(`${baseURL}/api/v1/dashboard`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(unauthorizedResponse.status()).toBe(401);
  });

  test('should handle invalid credentials', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/auth/login`, {
      headers: {
        'Content-Type': 'application/json',
        'x-secret-header': 'secret',
      },
      data: {
        email: 'wrong@email.com',
        password: 'wrongpassword',
      },
    });

    expect(response.status()).toBe(401);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
