const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../src/app');

// Helper function to extract CSRF token from cookies
function extractCsrfToken(cookies) {
  if (!cookies || !Array.isArray(cookies)) {
    throw new Error('No cookies received from login');
  }
  const csrfCookie = cookies.find(cookie => cookie.startsWith('csrfToken=') && !cookie.includes('1970'));
  if (!csrfCookie) {
    throw new Error('CSRF token not found in cookies');
  }
  return decodeURIComponent(csrfCookie.split(';')[0].split('=')[1]);
}

describe('Students Integration Tests', function () {
  this.timeout(10000);

  let agent;
  let csrfToken;
  let createdStudentId;

  before(async () => {
    // Create an agent and login
    agent = request.agent(app);
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@test.com',
        password: 'Test@1234'
      });

    // Extract CSRF token
    const cookies = loginRes.headers['set-cookie'];
    csrfToken = extractCsrfToken(cookies);
  });

  describe('GET /api/v1/students', () => {
    it('should get all students with authentication', async () => {
      const res = await agent
        .get('/api/v1/students')
        .set('x-csrf-token', csrfToken)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('students');
      expect(res.body.students).to.be.an('array');
      expect(res.body).to.have.property('pagination');
      expect(res.body.students.length).to.be.at.least(3); // Ben, Raul, Test Student
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
      const studentsRes = await agent
        .get('/api/v1/students')
        .set('x-csrf-token', csrfToken);

      if (studentsRes.body.students && studentsRes.body.students.length > 0) {
        const studentId = studentsRes.body.students[0].id;

        const res = await agent
          .get(`/api/v1/students/${studentId}`)
          .set('x-csrf-token', csrfToken)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body).to.have.property('id', studentId);
      }
    });

    it('should return 404 for non-existent student', async () => {
      await agent
        .get('/api/v1/students/99999')
        .set('x-csrf-token', csrfToken)
        .expect(404);
    });
  });

  describe('POST /api/v1/students', () => {
    it('should create a new student with valid data', async () => {
      const newStudent = {
        name: 'Integration Test',
        email: `integration.test.${Date.now()}@example.com`,
        dob: '2005-01-01',
        currentAddress: '123 Test Street',
        phone: '1234567890',
        gender: 'Male'
      };

      const res = await agent
        .post('/api/v1/students')
        .set('x-csrf-token', csrfToken)
        .send(newStudent)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('message');
      // Note: userId is not returned, will be fetched later if needed
    });

    it('should fail to create student with duplicate email', async () => {
      const duplicateStudent = {
        name: 'Duplicate Test',
        email: 'admin@test.com', // Existing email
        dob: '2005-01-01',
        currentAddress: '123 Test Street',
        phone: '1234567890',
        gender: 'Male'
      };

      const res = await agent
        .post('/api/v1/students')
        .set('x-csrf-token', csrfToken)
        .send(duplicateStudent)
        .expect(500);
        
      // API returns {success: false, error: {message: '...'}} format
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('error');
      expect(res.body.error.message).to.be.a('string').that.includes('Email already exists');
    });

    it('should fail to create student with missing required fields', async () => {
      const incompleteStudent = {
        name: 'Incomplete'
        // Missing email which is required
      };

      await agent
        .post('/api/v1/students')
        .set('x-csrf-token', csrfToken)
        .send(incompleteStudent)
        .expect(500);
    });
  });

  describe('PUT /api/v1/students/:id', () => {
    it('should update an existing student', function() {
      if (!createdStudentId) {
        this.skip();
        return;
      }

      const updateData = {
        userId: createdStudentId,
        name: 'Updated Name',
        phone: '9876543210'
      };

      return agent
        .put(`/api/v1/students/${createdStudentId}`)
        .set('x-csrf-token', csrfToken)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(res => {
          expect(res.body).to.have.property('message');
        });
    });

    it('should fail to update non-existent student', async () => {
      await agent
        .put('/api/v1/students/99999')
        .set('x-csrf-token', csrfToken)
        .send({ userId: 99999, name: 'Test' })
        .expect(500);
    });
  });

  describe('POST /api/v1/students/:id/status', () => {
    it('should change student status (disable/enable)', async () => {
      // Get an existing student
      const studentsRes = await agent
        .get('/api/v1/students')
        .set('x-csrf-token', csrfToken);

      if (studentsRes.body.students && studentsRes.body.students.length > 0) {
        const studentId = studentsRes.body.students[0].id;
        const currentStatus = studentsRes.body.students[0].systemAccess;

        const res = await agent
          .post(`/api/v1/students/${studentId}/status`)
          .set('x-csrf-token', csrfToken)
          .send({ status: !currentStatus })
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body).to.have.property('message');
      }
    });

    it('should fail to change status of non-existent student', async () => {
      await agent
        .post('/api/v1/students/99999/status')
        .set('x-csrf-token', csrfToken)
        .send({ status: false })
        .expect(404);
    });
  });

  describe('Student CRUD Flow (Create-Read-Update-Status)', () => {
    it('should complete full create -> read -> update -> change status flow', async () => {
      // Step 1: Create
      const newStudent = {
        name: 'CRUD Flow Test',
        email: `crud.flow.${Date.now()}@example.com`,
        dob: '2005-01-01',
        currentAddress: '123 CRUD Street',
        phone: '5555555555',
        gender: 'Male',
        className: 'Class 1',
        sectionName: 'Section 1',
        roll: 999
      };

      const createRes = await agent
        .post('/api/v1/students')
        .set('x-csrf-token', csrfToken)
        .send(newStudent)
        .expect(200);

      expect(createRes.body).to.have.property('message');
      expect(createRes.body.message).to.include('Student added');

      // Step 2: Find the created student
      const allStudentsRes = await agent
        .get('/api/v1/students?limit=100&sortBy=id&sortOrder=DESC')
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(allStudentsRes.body).to.have.property('students');
      const createdStudent = allStudentsRes.body.students.find(s => s.email === newStudent.email);
      expect(createdStudent).to.exist;
      const studentId = createdStudent.id;

      // Step 3: Read - Get student detail
      const readRes = await agent
        .get(`/api/v1/students/${studentId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(readRes.body).to.have.property('email', newStudent.email);
      expect(readRes.body).to.have.property('name', newStudent.name);

      // Step 4: Update - Modify student data
      const updateRes = await agent
        .put(`/api/v1/students/${studentId}`)
        .set('x-csrf-token', csrfToken)
        .send({ 
          userId: studentId, 
          name: 'Updated CRUD Name',
          email: newStudent.email,
          phone: '9999999999'
        })
        .expect(200);

      expect(updateRes.body).to.have.property('message');
      expect(updateRes.body.message).to.include('updated');

      // Step 5: Verify update
      const verifyRes = await agent
        .get(`/api/v1/students/${studentId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(verifyRes.body).to.have.property('name', 'Updated CRUD Name');

      // Step 6: Change status (disable student)
      const statusRes = await agent
        .post(`/api/v1/students/${studentId}/status`)
        .set('x-csrf-token', csrfToken)
        .send({ status: false })
        .expect(200);

      expect(statusRes.body).to.have.property('message');
      expect(statusRes.body.message).to.include('status changed');
    });
  });
});
