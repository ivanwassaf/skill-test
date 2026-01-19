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

describe('Notices Integration Tests', function () {
  this.timeout(10000);

  let agent;
  let csrfToken;
  let createdNoticeId;

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

  describe('GET /api/v1/notices/recipients/list', () => {
    it('should get notice recipient types', async () => {
      const res = await agent
        .get('/api/v1/notices/recipients/list')
        .set('x-csrf-token', csrfToken)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('noticeRecipients');
      expect(res.body.noticeRecipients).to.be.an('array');
      expect(res.body.noticeRecipients.length).to.be.at.least(3); // Admin, Teacher, Student
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/v1/notices/recipients/list')
        .expect(401);
    });
  });

  describe('GET /api/v1/notices', () => {
    it('should get all notices with authentication', async () => {
      const res = await agent
        .get('/api/v1/notices')
        .set('x-csrf-token', csrfToken)
        .expect('Content-Type', /json/);

      // Can be 200 with notices or 404 if no notices exist
      if (res.status === 200) {
        expect(res.body).to.have.property('notices');
        expect(res.body.notices).to.be.an('array');
      }
    });

    it('should fail without authentication', async () => {
      await request(app)
        .get('/api/v1/notices')
        .expect(401);
    });
  });

  describe('GET /api/v1/notices/:id', () => {
    it('should get a specific notice by ID if exists', async () => {
      const noticesRes = await agent
        .get('/api/v1/notices')
        .set('x-csrf-token', csrfToken);

      if (noticesRes.status === 200 && noticesRes.body.notices && noticesRes.body.notices.length > 0) {
        const noticeId = noticesRes.body.notices[0].id;

        const res = await agent
          .get(`/api/v1/notices/${noticeId}`)
          .set('x-csrf-token', csrfToken)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body).to.have.property('id', noticeId);
        expect(res.body).to.have.property('title');
      }
    });

    it('should return 404 for non-existent notice', async () => {
      await agent
        .get('/api/v1/notices/99999')
        .set('x-csrf-token', csrfToken)
        .expect(404);
    });
  });

  describe('POST /api/v1/notices', () => {
    it('should create a new notice with valid data', async () => {
      const newNotice = {
        title: `Test Notice ${Date.now()}`,
        description: 'This is a test notice for integration testing',
        recipientType: 1, // Admin
        status: 1 // Draft
      };

      const res = await agent
        .post('/api/v1/notices')
        .set('x-csrf-token', csrfToken)
        .send(newNotice)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('added');

      // Find the created notice
      const noticesRes = await agent
        .get('/api/v1/notices')
        .set('x-csrf-token', csrfToken);

      if (noticesRes.status === 200) {
        const created = noticesRes.body.notices.find(n => n.title === newNotice.title);
        if (created) {
          createdNoticeId = created.id;
        }
      }
    });

    it('should fail with missing title', async () => {
      await agent
        .post('/api/v1/notices')
        .set('x-csrf-token', csrfToken)
        .send({ description: 'Missing title' })
        .expect(500);
    });

    it('should fail with missing description', async () => {
      await agent
        .post('/api/v1/notices')
        .set('x-csrf-token', csrfToken)
        .send({ title: 'Missing description' })
        .expect(500);
    });
  });

  describe('PUT /api/v1/notices/:id', () => {
    it('should update an existing notice', async () => {
      if (!createdNoticeId) {
        const noticesRes = await agent.get('/api/v1/notices').set('x-csrf-token', csrfToken);
        if (noticesRes.status === 200 && noticesRes.body.notices && noticesRes.body.notices.length > 0) {
          createdNoticeId = noticesRes.body.notices[0].id;
        } else {
          // Create a notice first
          const newNotice = {
            title: `Update Test ${Date.now()}`,
            description: 'For update testing',
            recipientType: 1,
            status: 1
          };
          await agent.post('/api/v1/notices').set('x-csrf-token', csrfToken).send(newNotice);
          const res = await agent.get('/api/v1/notices').set('x-csrf-token', csrfToken);
          createdNoticeId = res.body.notices.find(n => n.title === newNotice.title).id;
        }
      }

      const updateData = {
        id: createdNoticeId,
        title: `Updated Notice ${Date.now()}`,
        description: 'Updated description',
        recipientType: 1,
        status: 1
      };

      const res = await agent
        .put(`/api/v1/notices/${createdNoticeId}`)
        .set('x-csrf-token', csrfToken)
        .send(updateData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('message');
      expect(res.body.message).to.include('updated');
    });

    it('should fail to update non-existent notice', async () => {
      await agent
        .put('/api/v1/notices/99999')
        .set('x-csrf-token', csrfToken)
        .send({ id: 99999, title: 'Test', description: 'Test' })
        .expect(500);
    });
  });

  describe('POST /api/v1/notices/:id/status', () => {
    it('should change notice status', async () => {
      if (!createdNoticeId) {
        const noticesRes = await agent.get('/api/v1/notices').set('x-csrf-token', csrfToken);
        if (noticesRes.status === 200 && noticesRes.body.notices && noticesRes.body.notices.length > 0) {
          createdNoticeId = noticesRes.body.notices[0].id;
        }
      }

      if (createdNoticeId) {
        const res = await agent
          .post(`/api/v1/notices/${createdNoticeId}/status`)
          .set('x-csrf-token', csrfToken)
          .send({ 
            noticeId: createdNoticeId,
            status: 2 // Submit for Review
          })
          .expect('Content-Type', /json/)
          .expect(200);

        expect(res.body).to.have.property('message');
      }
    });

    it('should fail to change status of non-existent notice', async () => {
      await agent
        .post('/api/v1/notices/99999/status')
        .set('x-csrf-token', csrfToken)
        .send({ noticeId: 99999, status: 2 })
        .expect(404);
    });
  });

  describe('Complete CRUD Flow for Notices', () => {
    it('should perform Create -> Read -> Update -> Change Status flow', async () => {
      // CREATE
      const newNotice = {
        title: `CRUD Notice ${Date.now()}`,
        description: 'Complete CRUD test for notices',
        recipientType: 1,
        status: 1
      };

      const createRes = await agent
        .post('/api/v1/notices')
        .set('x-csrf-token', csrfToken)
        .send(newNotice)
        .expect(200);

      expect(createRes.body.message).to.include('added');

      // FIND created notice
      const listRes = await agent
        .get('/api/v1/notices')
        .set('x-csrf-token', csrfToken)
        .expect(200);

      const created = listRes.body.notices.find(n => n.title === newNotice.title);
      expect(created).to.exist;
      const noticeId = created.id;

      // READ
      const readRes = await agent
        .get(`/api/v1/notices/${noticeId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(readRes.body.title).to.equal(newNotice.title);
      expect(readRes.body.description).to.equal(newNotice.description);

      // UPDATE
      const updateRes = await agent
        .put(`/api/v1/notices/${noticeId}`)
        .set('x-csrf-token', csrfToken)
        .send({ 
          id: noticeId, 
          title: `${newNotice.title} Updated`,
          description: 'Updated description for CRUD test',
          recipientType: 1,
          status: 1
        })
        .expect(200);

      expect(updateRes.body.message).to.include('updated');

      // VERIFY UPDATE
      const verifyRes = await agent
        .get(`/api/v1/notices/${noticeId}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(verifyRes.body.title).to.include('Updated');

      // CHANGE STATUS
      const statusRes = await agent
        .post(`/api/v1/notices/${noticeId}/status`)
        .set('x-csrf-token', csrfToken)
        .send({ noticeId, status: 2 }) // Submit for Review
        .expect(200);

      expect(statusRes.body.message).to.exist;
    });
  });
});
