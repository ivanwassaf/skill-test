const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../src/app');

describe('Students Integration Tests', function () {
  this.timeout(10000);

  let authToken;
  let cookies;
  let createdStudentId;

  before(async () => {
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@test.com',
        password: 'Test@1234'
      });

    authToken = loginRes.body.data.accessToken;
    cookies = loginRes.headers['set-cookie'];
  });

  describe('GET /api/v1/students', () => {
    it('should get all students with authentication', async () => {
      const res = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('data');
      expect(res.body.data).to.be.an('array');
    });

    it('should fail to get students without authentication', async () => {
      await request(app)
        .get('/api/v1/students')
        .expect(401);
    });

    it('should fail to get students with invalid token', async () => {
      await request(app)
        .get('/api/v1/students')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('GET /api/v1/students/:id', () => {
    it('should get a specific student by ID', async () => {
      // First get all students to get a valid ID
      const studentsRes = await request(app)
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies);

      if (studentsRes.body.data && studentsRes.body.data.length > 0) {
        const studentId = studentsRes.body.data[0].id;

        const res = await request(app)
          .get(`/api/v1/students/${studentId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('Cookie', cookies)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body).to.have.property('success', true);
        expect(res.body.data).to.have.property('id', studentId);
      }
    });

    it('should return 404 for non-existent student', async () => {
      await request(app)
        .get('/api/v1/students/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect(404);
    });
  });

  describe('POST /api/v1/students', () => {
    it('should create a new student with valid data', async () => {
      const newStudent = {
        first_name: 'Integration',
        last_name: 'Test',
        email: `integration.test.${Date.now()}@example.com`,
        date_of_birth: '2005-01-01',
        address: '123 Test Street',
        phone_number: '1234567890',
        class_id: 1,
        section_id: 1,
        admission_date: '2024-01-01'
      };

      const res = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send(newStudent)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('id');
      expect(res.body.data).to.have.property('email', newStudent.email);

      createdStudentId = res.body.data.id;
    });

    it('should fail to create student with duplicate email', async () => {
      const duplicateStudent = {
        first_name: 'Duplicate',
        last_name: 'Test',
        email: 'admin@test.com', // Existing email
        date_of_birth: '2005-01-01',
        address: '123 Test Street',
        phone_number: '1234567890'
      };

      await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send(duplicateStudent)
        .expect(409);
    });

    it('should fail to create student with missing required fields', async () => {
      const incompleteStudent = {
        first_name: 'Incomplete'
        // Missing last_name, email, etc.
      };

      await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send(incompleteStudent)
        .expect(400);
    });
  });

  describe('PUT /api/v1/students/:id', () => {
    it('should update an existing student', async () => {
      if (!createdStudentId) {
        this.skip();
      }

      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
        phone_number: '9876543210'
      };

      const res = await request(app)
        .put(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('first_name', 'Updated');
      expect(res.body.data).to.have.property('last_name', 'Name');
    });

    it('should fail to update non-existent student', async () => {
      await request(app)
        .put('/api/v1/students/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send({ first_name: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/v1/students/:id', () => {
    it('should delete an existing student', async () => {
      if (!createdStudentId) {
        this.skip();
      }

      const res = await request(app)
        .delete(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);

      // Verify student is deleted
      await request(app)
        .get(`/api/v1/students/${createdStudentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect(404);
    });

    it('should fail to delete non-existent student', async () => {
      await request(app)
        .delete('/api/v1/students/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect(404);
    });
  });

  describe('Student CRUD Flow', () => {
    it('should complete full create -> read -> update -> delete flow', async () => {
      // Step 1: Create
      const newStudent = {
        first_name: 'CRUD',
        last_name: 'Flow',
        email: `crud.flow.${Date.now()}@example.com`,
        date_of_birth: '2005-01-01',
        address: '123 CRUD Street',
        phone_number: '5555555555',
        class_id: 1,
        section_id: 1,
        admission_date: '2024-01-01'
      };

      const createRes = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send(newStudent)
        .expect(201);

      const studentId = createRes.body.data.id;

      // Step 2: Read
      const readRes = await request(app)
        .get(`/api/v1/students/${studentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect(200);

      expect(readRes.body.data).to.have.property('email', newStudent.email);

      // Step 3: Update
      const updateRes = await request(app)
        .put(`/api/v1/students/${studentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .send({ first_name: 'Updated CRUD' })
        .expect(200);

      expect(updateRes.body.data).to.have.property('first_name', 'Updated CRUD');

      // Step 4: Delete
      await request(app)
        .delete(`/api/v1/students/${studentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect(200);

      // Step 5: Verify deletion
      await request(app)
        .get(`/api/v1/students/${studentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('Cookie', cookies)
        .expect(404);
    });
  });
});
