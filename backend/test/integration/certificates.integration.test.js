const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../../src/app');
const { blockchainService } = require('../../src/modules/certificates');

// Helper function to extract CSRF token from cookies
function extractCsrfToken(cookies) {
  if (!cookies || !Array.isArray(cookies)) return null;
  
  const csrfCookie = cookies.find(cookie => 
    cookie.startsWith('csrfToken=') && !cookie.includes('1970')
  );
  
  if (!csrfCookie) return null;
  
  const tokenMatch = csrfCookie.match(/csrfToken=([^;]+)/);
  return tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
}

describe('Certificates Integration Tests', function () {
  this.timeout(10000);

  let agent;
  let csrfToken;
  let studentId;
  let certificateId;

  before(async () => {
    // Initialize blockchain service
    await blockchainService.initialize();

    // Create an agent to maintain session
    agent = request.agent(app);

    // Login to get auth token
    const loginRes = await agent
      .post('/api/v1/auth/login')
      .send({
        username: 'admin@test.com',
        password: 'Test@1234'
      });

    // Extract CSRF token from cookies
    csrfToken = extractCsrfToken(loginRes.headers['set-cookie']);

    // Get a student ID for certificate tests
    const studentsRes = await agent
      .get('/api/v1/students')
      .set('x-csrf-token', csrfToken);

    if (studentsRes.body.data && studentsRes.body.data.length > 0) {
      studentId = studentsRes.body.data[0].id;
    }
  });

  describe('GET /api/v1/certificates/health', () => {
    it('should return blockchain service health status', async () => {
      const res = await agent
        .get('/api/v1/certificates/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('initialized');
      expect(res.body.data).to.have.property('message');
    });
  });

  describe('POST /api/v1/certificates/issue', () => {
    it('should issue a certificate with valid data when blockchain is available', async function () {
      const certificateData = {
        studentId: studentId || 1,
        certificateType: 'Integration Testing Course',
        achievement: 'Grade A',
        additionalInfo: {
          instructor: 'Prof. Integration',
          duration: '6 months'
        }
      };

      const res = await agent
        .post('/api/v1/certificates/issue')
        .set('x-csrf-token', csrfToken)
        .send(certificateData);

      // If blockchain is not initialized, should return 503
      if (res.status === 503) {
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message');
        this.skip();
      } else {
        expect(res.status).to.equal(201);
        expect(res.body).to.have.property('success', true);
        expect(res.body.data).to.have.property('certificateId');
        expect(res.body.data).to.have.property('transactionHash');
        expect(res.body.data).to.have.property('ipfsHash');

        certificateId = res.body.data.certificateId;
      }
    });

    it('should fail to issue certificate without authentication', async () => {
      await request(app)
        .post('/api/v1/certificates/issue')
        .send({
          studentId: 1,
          certificateType: 'Test Course',
          achievement: 'A'
        })
        .expect(401);
    });

    it('should fail to issue certificate with missing required fields', async () => {
      const res = await agent
        .post('/api/v1/certificates/issue')
        .set('x-csrf-token', csrfToken)
        .send({
          achievement: 'Test Achievement'
          // Missing studentId and certificateType
        });

      expect(res.status).to.be.oneOf([400, 503]);
    });
  });

  describe('GET /api/v1/certificates/:id', () => {
    it('should get certificate by ID when blockchain is available', async function () {
      if (!certificateId) {
        this.skip();
      }

      const res = await agent
        .get(`/api/v1/certificates/${certificateId}`)
        .set('x-csrf-token', csrfToken);

      if (res.status === 503) {
        this.skip();
      }

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('certificateId', certificateId);
    });

    it('should return 404 for non-existent certificate', async function () {
      const res = await agent
        .get('/api/v1/certificates/99999999')
        .set('x-csrf-token', csrfToken);

      // If blockchain not available, will return 503
      if (res.status === 503) {
        this.skip();
      }

      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/v1/certificates/verify', () => {
    it('should verify a valid certificate when blockchain is available', async function () {
      if (!certificateId) {
        this.skip();
      }

      const res = await agent
        .post('/api/v1/certificates/verify')
        .set('x-csrf-token', csrfToken)
        .send({ certificateId });

      if (res.status === 503) {
        this.skip();
      }

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('valid');
      expect(res.body.data).to.have.property('certificateId', certificateId);
    });

    it('should return invalid for non-existent certificate', async function () {
      const res = await agent
        .post('/api/v1/certificates/verify')
        .set('x-csrf-token', csrfToken)
        .send({ certificateId: 99999999 });

      if (res.status === 503) {
        this.skip();
      }

      expect(res.status).to.be.oneOf([200, 404]);
      if (res.status === 200) {
        expect(res.body.data).to.have.property('valid', false);
      }
    });
  });

  describe('GET /api/v1/certificates/student/:studentId', () => {
    it('should get all certificates for a student', async function () {
      if (!studentId) {
        this.skip();
      }

      const res = await agent
        .get(`/api/v1/certificates/student/${studentId}`)
        .set('x-csrf-token', csrfToken);

      if (res.status === 503) {
        this.skip();
      }

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/v1/certificates/stats', () => {
    it('should get certificate statistics', async function () {
      const res = await agent
        .get('/api/v1/certificates/stats')
        .set('x-csrf-token', csrfToken);

      if (res.status === 503) {
        this.skip();
      }

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('totalCertificates');
    });
  });

  describe('Certificate Issuance Flow', () => {
    it('should complete full issue -> verify -> retrieve flow', async function () {
      if (!studentId) {
        this.skip();
      }

      // Step 1: Issue certificate
      const issueRes = await agent
        .post('/api/v1/certificates/issue')
        .set('x-csrf-token', csrfToken)
        .send({
          studentId,
          certificateType: 'Full Flow Test Course',
          achievement: 'Grade A+',
          additionalInfo: {
            instructor: 'Prof. Flow',
            duration: '1 year'
          }
        });

      if (issueRes.status === 503) {
        this.skip();
      }

      expect(issueRes.status).to.equal(201);
      const newCertificateId = issueRes.body.data.certificateId;

      // Step 2: Verify certificate
      const verifyRes = await agent
        .post('/api/v1/certificates/verify')
        .set('x-csrf-token', csrfToken)
        .send({ certificateId: newCertificateId });

      expect(verifyRes.status).to.equal(200);
      expect(verifyRes.body.data).to.have.property('valid', true);

      // Step 3: Retrieve certificate details
      const getRes = await agent
        .get(`/api/v1/certificates/${newCertificateId}`)
        .set('x-csrf-token', csrfToken);

      expect(getRes.status).to.equal(200);
      expect(getRes.body.data).to.have.property('certificateId', newCertificateId);
      expect(getRes.body.data).to.have.property('studentId', studentId);

      // Step 4: Check student certificates list
      const studentCertsRes = await agent
        .get(`/api/v1/certificates/student/${studentId}`)
        .set('x-csrf-token', csrfToken);

      expect(studentCertsRes.status).to.equal(200);
      const certificates = studentCertsRes.body.data;
      expect(certificates).to.be.an('array');
      expect(certificates.some(cert => cert.certificateId === newCertificateId)).to.be.true;
    });
  });
});
