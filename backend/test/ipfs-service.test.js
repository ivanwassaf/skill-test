const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');

describe('IPFSService', function () {
  let ipfsService;
  let axiosStub;

  beforeEach(function () {
    // Reset module cache
    delete require.cache[require.resolve('../src/modules/certificates/ipfs-service')];
    
    // Stub axios
    axiosStub = sinon.stub(axios, 'post');
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('isConfigured', function () {
    it('should return false when API key is missing', function () {
      delete process.env.PINATA_API_KEY;
      delete process.env.PINATA_SECRET_KEY;
      
      ipfsService = require('../src/modules/certificates/ipfs-service');
      expect(ipfsService.isConfigured()).to.be.false;
    });

    it('should return false when secret key is missing', function () {
      process.env.PINATA_API_KEY = 'test_key';
      delete process.env.PINATA_SECRET_KEY;
      
      ipfsService = require('../src/modules/certificates/ipfs-service');
      expect(ipfsService.isConfigured()).to.be.false;
    });

    it('should return true when both keys are configured', function () {
      process.env.PINATA_API_KEY = 'test_api_key';
      process.env.PINATA_SECRET_KEY = 'test_secret_key';
      
      ipfsService = require('../src/modules/certificates/ipfs-service');
      expect(ipfsService.isConfigured()).to.be.true;
    });
  });

  describe('uploadCertificateMetadata', function () {
    beforeEach(function () {
      process.env.PINATA_API_KEY = 'test_api_key';
      process.env.PINATA_SECRET_KEY = 'test_secret_key';
      ipfsService = require('../src/modules/certificates/ipfs-service');
    });

    it('should upload metadata successfully', async function () {
      const mockResponse = {
        data: {
          IpfsHash: 'QmTestHash123',
          PinSize: 1234,
          Timestamp: '2024-01-17T00:00:00.000Z'
        }
      };
      axiosStub.resolves(mockResponse);

      const metadata = {
        studentName: 'John Doe',
        certificateType: 'Academic Excellence'
      };

      const result = await ipfsService.uploadCertificateMetadata(metadata);
      
      expect(result).to.have.property('ipfsHash', 'QmTestHash123');
      expect(result).to.have.property('url').that.includes('QmTestHash123');
      expect(result).to.have.property('timestamp');
    });

    it('should throw error when upload fails', async function () {
      axiosStub.rejects(new Error('Upload failed'));

      const metadata = { studentName: 'John Doe' };

      try {
        await ipfsService.uploadCertificateMetadata(metadata);
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Failed to upload');
      }
    });

    it('should throw error when not configured', async function () {
      delete process.env.PINATA_API_KEY;
      delete require.cache[require.resolve('../src/modules/certificates/ipfs-service')];
      ipfsService = require('../src/modules/certificates/ipfs-service');

      try {
        await ipfsService.uploadCertificateMetadata({});
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('IPFS service not configured');
      }
    });
  });

  describe('getCertificateMetadata', function () {
    beforeEach(function () {
      process.env.PINATA_API_KEY = 'test_api_key';
      process.env.PINATA_SECRET_KEY = 'test_secret_key';
      ipfsService = require('../src/modules/certificates/ipfs-service');
      sinon.restore();
      sinon.stub(axios, 'get');
    });

    it('should retrieve metadata successfully', async function () {
      const mockMetadata = {
        studentName: 'John Doe',
        certificateType: 'Academic Excellence'
      };
      
      axios.get.resolves({ data: mockMetadata });

      const result = await ipfsService.getCertificateMetadata('QmTestHash123');
      
      expect(result).to.deep.equal(mockMetadata);
    });

    it('should handle retrieval errors', async function () {
      axios.get.rejects(new Error('Not found'));

      try {
        await ipfsService.getCertificateMetadata('QmInvalidHash');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch');
      }
    });

    it('should handle empty IPFS hash', async function () {
      // Note: The service doesn't validate empty hash, it just tries to fetch
      // We expect an axios error instead
      try {
        await ipfsService.getCertificateMetadata('');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Failed to fetch');
      }
    });
  });

  describe('pinByHash', function () {
    beforeEach(function () {
      process.env.PINATA_API_KEY = 'test_api_key';
      process.env.PINATA_SECRET_KEY = 'test_secret_key';
      delete require.cache[require.resolve('../src/modules/certificates/ipfs-service')];
      ipfsService = require('../src/modules/certificates/ipfs-service');
    });

    it('should pin hash successfully', async function () {
      const mockResponse = {
        data: { status: 'pinned' }
      };
      axiosStub.resolves(mockResponse);

      const result = await ipfsService.pinByHash('QmHash123');
      
      expect(result).to.have.property('success', true);
    });

    it('should throw error when not configured', async function () {
      delete process.env.PINATA_API_KEY;
      delete require.cache[require.resolve('../src/modules/certificates/ipfs-service')];
      ipfsService = require('../src/modules/certificates/ipfs-service');
      
      try {
        await ipfsService.pinByHash('QmHash123');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not configured');
      }
    });
  });
});
