const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../src/app');

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

describe('Departments Integration Tests', function () {
  this.timeout(10000);

  let agent;
  let csrfToken;
  let createdDeptId;

  before(async () => {
    agent = request.agent(app);
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@test.com',
        password: 'Test@1234'
      });

    const cookies = loginRes.headers['set-cookie'];
    csrfToken = extractCsrfToken(cookies);
  });

  describe('GET /api/v1/departments', () => {
    it('should get all departments with authentication', async () => {
      const res = await agent
        .get('/api/v1/departments')
        .set('x-csrf-token', csrfToken)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('departments');
      expect(res.body.departments).to.be.an('array');
      // Don't assume pre-existing data - just verify structure
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/v1/departments')
        .expect(401);
    });
  });

  describe('GET /api/v1/departments/:id', () => {
    it('should get a specific department by ID', async () => {
      const deptsRes = await agent
        .get('/api/v1/departments')
        .set('x-csrf-token', csrfToken);

      if (deptsRes.body.departments && deptsRes.body.departments.length > 0) {
        const deptId = deptsRes.body.departments[0].id;

        const res = await agent
          .get(`/api/v1/departments/${deptId}`)
          .set('x-csrf-token', csrfToken)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body).to.have.property('id', deptId);
        expect(res.body).to.have.property('name');
      }
    });

    it('should return 404 for non-existent department', async () => {
      await agent
        .get('/api/v1/departments/99999')
        .set('x-csrf-token', csrfToken)
        .expect(404);
    });
  });

  describe('POST /api/v1/departments', () => {
    it('should create a new department with valid data', async () => {
      const newDept = {
        name: `Test Department ${Date.now()}`
      };

      const res = await agent
        .post('/api/v1/departments')
        .set('x-csrf-token', csrfToken)
        .send(newDept)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('added');
      
      // Find the created department
      const deptsRes = await agent
        .get('/api/v1/departments')
        .set('x-csrf-token', csrfToken);
      
      const created = deptsRes.body.departments.find(d => d.name === newDept.name);
      expect(created).to.exist;
      createdDeptId = created.id;
    });

    it('should fail to create department with duplicate name', async () => {
      if (createdDeptId) {
        const deptsRes = await agent.get('/api/v1/departments').set('x-csrf-token', csrfToken);
        const existingName = deptsRes.body.departments[0].name;

        await agent
          .post('/api/v1/departments')
          .set('x-csrf-token', csrfToken)
          .send({ name: existingName })
          .expect(500);
      }
    });

    it('should fail with missing name', async () => {
      await agent
        .post('/api/v1/departments')
        .set('x-csrf-token', csrfToken)
        .send({})
        .expect(500);
    });
  });

  describe('PUT /api/v1/departments/:id', () => {
    it('should update an existing department', async () => {
      if (!createdDeptId) {
        const res = await agent.get('/api/v1/departments').set('x-csrf-token', csrfToken);
        createdDeptId = res.body.departments[0].id;
      }

      const updateData = {
        id: createdDeptId,
        name: `Updated Department ${Date.now()}`
      };

      const res = await agent
        .put(`/api/v1/departments/${createdDeptId}`)
        .set('x-csrf-token', csrfToken)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('updated');
    });

    it('should fail to update non-existent department', async () => {
      await agent
        .put('/api/v1/departments/99999')
        .set('x-csrf-token', csrfToken)
        .send({ id: 99999, name: 'Test' })
        .expect(500);
    });
  });

  describe('DELETE /api/v1/departments/:id', () => {
    it('should delete a department', async () => {
      // Create a new one to delete
      const newDept = {
        name: `Delete Test ${Date.now()}`
      };
      
      await agent
        .post('/api/v1/departments')
        .set('x-csrf-token', csrfToken)
        .send(newDept);
      
      const deptsRes = await agent.get('/api/v1/departments').set('x-csrf-token', csrfToken);
      const created = deptsRes.body.departments.find(d => d.name === newDept.name);
      const deptId = created.id;

      const res = await agent
        .delete(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('deleted');

      // Verify deletion
      await agent
        .get(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .expect(404);
    });

    it('should fail to delete non-existent department', async () => {
      await agent
        .delete('/api/v1/departments/99999')
        .set('x-csrf-token', csrfToken)
        .expect(500);
    });
  });

  describe('Complete CRUD Flow for Departments', () => {
    it('should perform Create -> Read -> Update -> Delete flow', async () => {
      // CREATE
      const newDept = {
        name: `CRUD Department ${Date.now()}`
      };

      const createRes = await agent
        .post('/api/v1/departments')
        .set('x-csrf-token', csrfToken)
        .send(newDept)
        .expect(200);

      expect(createRes.body.message).to.include('added');

      // FIND created department
      const listRes = await agent
        .get('/api/v1/departments')
        .set('x-csrf-token', csrfToken)
        .expect(200);

      const created = listRes.body.departments.find(d => d.name === newDept.name);
      expect(created).to.exist;
      const deptId = created.id;

      // READ
      const readRes = await agent
        .get(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(readRes.body.name).to.equal(newDept.name);

      // UPDATE
      const updateRes = await agent
        .put(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .send({ id: deptId, name: `${newDept.name} Updated` })
        .expect(200);

      expect(updateRes.body.message).to.include('updated');

      // VERIFY UPDATE
      const verifyRes = await agent
        .get(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(verifyRes.body.name).to.include('Updated');

      // DELETE
      const deleteRes = await agent
        .delete(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(deleteRes.body.message).to.include('deleted');

      // VERIFY DELETION
      await agent
        .get(`/api/v1/departments/${deptId}`)
        .set('x-csrf-token', csrfToken)
        .expect(404);
    });
  });
});
