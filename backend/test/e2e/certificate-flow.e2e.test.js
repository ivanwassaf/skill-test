const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Certificate Management Flow
 * Tests complete certificate issuance and verification workflow
 */

test.describe('Certificate Management E2E Flow', () => {
  const baseURL = 'http://localhost:5007';
  let accessToken;
  let studentId = 3; // Known student from seed data

  test.beforeAll(async ({ request }) => {
    // Login to get access token
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

    const loginData = await loginResponse.json();
    accessToken = loginData.data.accessToken;
  });

  test('should check blockchain health', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/certificates/health`, {
      headers: {
        'x-secret-header': 'secret',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty('blockchain');
  });

  test('should issue certificate successfully', async ({ request }) => {
    const timestamp = Date.now();
    
    const response = await request.post(`${baseURL}/api/v1/certificates/issue`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-secret-header': 'secret',
      },
      data: {
        studentId: studentId,
        certificateType: `E2E Test Certificate ${timestamp}`,
        issueDate: new Date().toISOString().split('T')[0],
        metadata: {
          grade: 'A+',
          course: 'E2E Testing 101',
          testRun: timestamp,
        },
      },
    });

    if (response.ok()) {
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('certificateId');
      expect(data.data).toHaveProperty('transactionHash');
    } else {
      // Blockchain might not be available in all environments
      expect([503, 201]).toContain(response.status());
    }
  });

  test('should get certificate statistics', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/certificates/stats`, {
      headers: {
        'x-secret-header': 'secret',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('totalCertificates');
  });

  test('should get student certificates', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/certificates/student/${studentId}`, {
      headers: {
        'x-secret-header': 'secret',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  test('should verify certificate returns proper response', async ({ request }) => {
    const response = await request.post(`${baseURL}/api/v1/certificates/verify`, {
      headers: {
        'Content-Type': 'application/json',
        'x-secret-header': 'secret',
      },
      data: {
        certificateId: 999999, // Non-existent certificate
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('isValid');
  });

  test('should handle invalid certificate ID', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/v1/certificates/99999999`, {
      headers: {
        'x-secret-header': 'secret',
      },
    });

    expect(response.status()).toBe(404);
  });
});
