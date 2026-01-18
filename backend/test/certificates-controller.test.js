const { expect } = require('chai');
const sinon = require('sinon');

describe('CertificatesController', function () {
  let req, res, next;
  let blockchainServiceStub;
  let ipfsServiceStub;
  let studentsRepositoryStub;
  let certificatesController;

  beforeEach(function () {
    // Reset module cache
    const modulesToReset = [
      '../src/modules/certificates/certificates-controller',
      '../src/modules/certificates/blockchain-service',
      '../src/modules/certificates/ipfs-service',
      '../src/modules/students/students-repository'
    ];
    
    modulesToReset.forEach(mod => {
      delete require.cache[require.resolve(mod)];
    });

    // Mock request and response
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 1, name: 'Admin User' }
    };

    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub().returnsThis()
    };

    next = sinon.stub();

    // Create stubs
    blockchainServiceStub = {
      isInitialized: sinon.stub().returns(true),
      issueCertificate: sinon.stub(),
      verifyCertificate: sinon.stub(),
      getCertificate: sinon.stub(),
      getStudentCertificates: sinon.stub(),
      revokeCertificate: sinon.stub(),
      getTotalCertificates: sinon.stub()
    };

    ipfsServiceStub = {
      isConfigured: sinon.stub().returns(false),
      uploadCertificateMetadata: sinon.stub(),
      getCertificateMetadata: sinon.stub()
    };

    studentsRepositoryStub = {
      findStudentDetail: sinon.stub()
    };

    // Mock modules
    const Module = require('module');
    const originalRequire = Module.prototype.require;

    Module.prototype.require = function(id) {
      if (id === './blockchain-service') {
        return blockchainServiceStub;
      }
      if (id === './ipfs-service') {
        return ipfsServiceStub;
      }
      if (id === '../students/students-repository') {
        return studentsRepositoryStub;
      }
      return originalRequire.apply(this, arguments);
    };

    certificatesController = require('../src/modules/certificates/certificates-controller');
    
    // Restore require
    Module.prototype.require = originalRequire;
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('handleIssueCertificate', function () {
    it('should issue certificate successfully without IPFS', async function () {
      req.body = {
        studentId: '1',
        certificateType: 'Academic Excellence',
        achievement: 'Outstanding performance'
      };

      const mockStudent = {
        id: '1',
        name: 'John Doe',
        email: 'john@students.com'
      };

      const mockBlockchainResult = {
        certificateId: 1,
        transactionHash: '0xtxhash',
        blockNumber: 100
      };

      studentsRepositoryStub.findStudentDetail.resolves(mockStudent);
      blockchainServiceStub.issueCertificate.resolves(mockBlockchainResult);

      await certificatesController.handleIssueCertificate(req, res);

      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const response = res.json.firstCall.args[0];
      expect(response.success).to.be.true;
      expect(response.data).to.have.property('certificateId', 1);
      expect(response.data).to.have.property('transactionHash', '0xtxhash');
    });

    it('should return 400 when studentId is missing', async function () {
      req.body = {
        certificateType: 'Academic Excellence'
      };

      await certificatesController.handleIssueCertificate(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', false);
    });

    it('should return 400 when certificateType is missing', async function () {
      req.body = {
        studentId: '1'
      };

      await certificatesController.handleIssueCertificate(req, res);

      expect(res.status.calledWith(400)).to.be.true;
    });

    it('should return 503 when blockchain is not initialized', async function () {
      req.body = {
        studentId: '1',
        certificateType: 'Academic Excellence'
      };

      blockchainServiceStub.isInitialized.returns(false);

      await certificatesController.handleIssueCertificate(req, res);

      expect(res.status.calledWith(503)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.include('Blockchain service not available');
    });

    it('should return 404 when student is not found', async function () {
      req.body = {
        studentId: '999',
        certificateType: 'Academic Excellence'
      };

      studentsRepositoryStub.findStudentDetail.resolves(null);

      await certificatesController.handleIssueCertificate(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.firstCall.args[0].message).to.equal('Student not found');
    });

    it('should handle blockchain errors gracefully', async function () {
      req.body = {
        studentId: '1',
        certificateType: 'Academic Excellence'
      };

      studentsRepositoryStub.findStudentDetail.resolves({ id: '1', name: 'John', email: 'john@test.com' });
      blockchainServiceStub.issueCertificate.rejects(new Error('Blockchain error'));

      await certificatesController.handleIssueCertificate(req, res);

      expect(res.status.calledWith(500)).to.be.true;
    });

    it('should generate deterministic address for student without wallet', async function () {
      req.body = {
        studentId: '1',
        certificateType: 'Academic Excellence'
      };

      const mockStudent = {
        id: '1',
        name: 'John Doe',
        email: 'john@students.com',
        wallet_address: null
      };

      studentsRepositoryStub.findStudentDetail.resolves(mockStudent);
      blockchainServiceStub.issueCertificate.resolves({
        certificateId: 1,
        transactionHash: '0xtx',
        blockNumber: 100
      });

      await certificatesController.handleIssueCertificate(req, res);

      // Verify blockchain service was called with a valid address (not 0x0000...)
      const callArgs = blockchainServiceStub.issueCertificate.firstCall.args;
      expect(callArgs[0]).to.match(/^0x[a-fA-F0-9]{40}$/);
      expect(callArgs[0]).to.not.equal('0x0000000000000000000000000000000000000000');
    });
  });

  describe('handleVerifyCertificate', function () {
    it('should verify certificate successfully', async function () {
      req.params = { certificateId: '1' };

      blockchainServiceStub.verifyCertificate.resolves(true);

      await certificatesController.handleVerifyCertificate(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.include({
        success: true,
        valid: true
      });
    });

    it('should return false for invalid certificate', async function () {
      req.params = { certificateId: '999' };

      blockchainServiceStub.verifyCertificate.resolves(false);

      await certificatesController.handleVerifyCertificate(req, res);

      expect(res.json.firstCall.args[0]).to.have.property('valid', false);
    });

    it('should return 503 when blockchain is not initialized', async function () {
      req.params = { certificateId: '1' };
      blockchainServiceStub.isInitialized.returns(false);

      await certificatesController.handleVerifyCertificate(req, res);

      expect(res.status.calledWith(503)).to.be.true;
    });
  });

  describe('handleGetCertificate', function () {
    it('should get certificate details successfully', async function () {
      req.params = { certificateId: '1' };

      const mockCertificate = {
        id: 1,
        studentName: 'John Doe',
        certificateType: 'Academic Excellence',
        ipfsHash: 'QmHash123'
      };

      blockchainServiceStub.getCertificate.resolves(mockCertificate);
      ipfsServiceStub.getCertificateMetadata.resolves({ name: 'Certificate Data' });

      await certificatesController.handleGetCertificate(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const responseData = res.json.firstCall.args[0].data;
      expect(responseData).to.have.property('id', 1);
      expect(responseData).to.have.property('studentName', 'John Doe');
      expect(responseData).to.have.property('ipfsUrl');
      expect(responseData).to.have.property('metadata');
    });

    it('should handle errors when getting certificate', async function () {
      req.params = { certificateId: '1' };

      blockchainServiceStub.getCertificate.rejects(new Error('Not found'));

      await certificatesController.handleGetCertificate(req, res);

      expect(res.status.calledWith(500)).to.be.true;
    });
  });

  describe('handleRevokeCertificate', function () {
    it('should revoke certificate successfully', async function () {
      req.params = { certificateId: '1' };

      const mockResult = {
        transactionHash: '0xtxhash',
        blockNumber: 100
      };

      blockchainServiceStub.revokeCertificate.resolves(mockResult);

      await certificatesController.handleRevokeCertificate(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('success', true);
    });

    it('should return 503 when blockchain is not initialized', async function () {
      req.params = { certificateId: '1' };
      blockchainServiceStub.isInitialized.returns(false);

      await certificatesController.handleRevokeCertificate(req, res);

      expect(res.status.calledWith(503)).to.be.true;
    });
  });

  describe('handleGetStudentCertificates', function () {
    it('should get all student certificates', async function () {
      req.params = { studentId: '1' };

      const mockStudent = {
        id: '1',
        name: 'John Doe',
        email: 'john@test.com'
      };

      studentsRepositoryStub.findStudentDetail.resolves(mockStudent);
      blockchainServiceStub.getStudentCertificates.resolves([1, 2]);
      blockchainServiceStub.getCertificate.onFirstCall().resolves({ id: 1 });
      blockchainServiceStub.getCertificate.onSecondCall().resolves({ id: 2 });

      await certificatesController.handleGetStudentCertificates(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.firstCall.args[0].data).to.be.an('array').with.lengthOf(2);
    });

    it('should return 404 when student not found', async function () {
      req.params = { studentId: '999' };

      studentsRepositoryStub.findStudentDetail.resolves(null);

      await certificatesController.handleGetStudentCertificates(req, res);

      expect(res.status.calledWith(404)).to.be.true;
    });
  });

  describe('handleGetStats', function () {
    it('should return certificate statistics', async function () {
      blockchainServiceStub.getTotalCertificates.resolves(42);

      await certificatesController.handleGetStats(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.data.totalCertificates).to.equal(42);
    });

    it('should return stats when blockchain is not initialized', async function () {
      blockchainServiceStub.isInitialized.returns(false);

      await certificatesController.handleGetStats(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      const response = res.json.firstCall.args[0];
      expect(response.data.initialized).to.be.false;
    });
  });
});
