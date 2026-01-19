const { test, expect } = require('@playwright/test');

/**
 * E2E Tests: Student CRUD Operations
 * Tests complete student management workflow
 */

test.describe('Student CRUD E2E Flow', () => {
  const baseURL = 'http://localhost:5007';
  let accessToken;
  let createdStudentId;

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

  test('should complete full student CRUD flow', async ({ request }) => {
    const timestamp = Date.now();
    const uniqueEmail = `student.e2e.${timestamp}@test.com`;

    // CREATE
    const createResponse = await request.post(`${baseURL}/api/v1/students`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-secret-header': 'secret',
      },
      data: {
        name: `E2E Test Student ${timestamp}`,
        email: uniqueEmail,
        phone: '1234567890',
        section_id: 1,
        class_id: 1,
        department_id: 1,
      },
    });

    expect(createResponse.ok()).toBeTruthy();
    const createData = await createResponse.json();
    expect(createData.success).toBe(true);
    createdStudentId = createData.data.id;

    // READ - Get all students
    const listResponse = await request.get(`${baseURL}/api/v1/students?limit=100`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(listResponse.ok()).toBeTruthy();
    const listData = await listResponse.json();
    expect(listData.success).toBe(true);
    expect(listData.data).toBeInstanceOf(Array);
    const foundStudent = listData.data.find(s => s.id === createdStudentId);
    expect(foundStudent).toBeTruthy();
    expect(foundStudent.email).toBe(uniqueEmail);

    // READ - Get specific student
    const getResponse = await request.get(`${baseURL}/api/v1/students/${createdStudentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    const getData = await getResponse.json();
    expect(getData.success).toBe(true);
    expect(getData.data.id).toBe(createdStudentId);
    expect(getData.data.email).toBe(uniqueEmail);

    // UPDATE
    const updatedName = `Updated E2E Student ${timestamp}`;
    const updateResponse = await request.put(`${baseURL}/api/v1/students/${createdStudentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-secret-header': 'secret',
      },
      data: {
        name: updatedName,
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updateData = await updateResponse.json();
    expect(updateData.success).toBe(true);

    // Verify update
    const verifyResponse = await request.get(`${baseURL}/api/v1/students/${createdStudentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    const verifyData = await verifyResponse.json();
    expect(verifyData.data.name).toBe(updatedName);

    // DELETE
    const deleteResponse = await request.delete(`${baseURL}/api/v1/students/${createdStudentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(deleteResponse.status()).toBe(404); // Student repository returns 404 for soft delete

    // Verify deletion (should return 404)
    const deletedResponse = await request.get(`${baseURL}/api/v1/students/${createdStudentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'x-secret-header': 'secret',
      },
    });

    expect(deletedResponse.status()).toBe(404);
  });

  test('should enforce authorization', async ({ request }) => {
    // Try to access without token
    const response = await request.get(`${baseURL}/api/v1/students`, {
      headers: {
        'x-secret-header': 'secret',
      },
    });

    expect(response.status()).toBe(401);
  });
});
