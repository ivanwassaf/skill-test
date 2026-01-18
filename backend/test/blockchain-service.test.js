const { expect } = require('chai');
const sinon = require('sinon');

describe('BlockchainService', function () {
  let blockchainService;

  beforeEach(function () {
    // Reset module cache to get fresh instance
    delete require.cache[require.resolve('../src/modules/certificates/blockchain-service')];
    
    // Set required environment variables
    process.env.BLOCKCHAIN_NETWORK = 'localhost';
    process.env.BLOCKCHAIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
    process.env.LOCALHOST_RPC_URL = 'http://127.0.0.1:8545';
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('Module Export', function () {
    it('should export blockchain service singleton', function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      expect(blockchainService).to.be.an('object');
      expect(blockchainService).to.have.property('initialize');
      expect(blockchainService).to.have.property('isInitialized');
    });
  });

  describe('isInitialized', function () {
    it('should return false when not initialized', function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      expect(blockchainService.isInitialized()).to.be.false;
    });
  });

  describe('getRpcUrl', function () {
    it('should return localhost URL for localhost network', function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      const url = blockchainService.getRpcUrl('localhost');
      expect(url).to.be.a('string');
      expect(url).to.include('127.0.0.1');
    });

    it('should return sepolia URL for sepolia network when configured', function () {
      process.env.SEPOLIA_RPC_URL = 'https://eth-sepolia.example.com';
      delete require.cache[require.resolve('../src/modules/certificates/blockchain-service')];
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const url = blockchainService.getRpcUrl('sepolia');
      expect(url).to.be.a('string');
      expect(url).to.include('sepolia');
    });

    it('should return default localhost URL for unknown network', function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      const url = blockchainService.getRpcUrl('unknown');
      expect(url).to.be.a('string');
      expect(url).to.include('127.0.0.1');
    });
  });

  describe('Service Methods', function () {
    beforeEach(function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
    });

    it('should have issueCertificate method', function () {
      expect(blockchainService.issueCertificate).to.be.a('function');
    });

    it('should have verifyCertificate method', function () {
      expect(blockchainService.verifyCertificate).to.be.a('function');
    });

    it('should have getCertificate method', function () {
      expect(blockchainService.getCertificate).to.be.a('function');
    });

    it('should have getStudentCertificates method', function () {
      expect(blockchainService.getStudentCertificates).to.be.a('function');
    });

    it('should have revokeCertificate method', function () {
      expect(blockchainService.revokeCertificate).to.be.a('function');
    });

    it('should have getTotalCertificates method', function () {
      expect(blockchainService.getTotalCertificates).to.be.a('function');
    });

    it('should have addIssuer method', function () {
      expect(blockchainService.addIssuer).to.be.a('function');
    });

    it('should have removeIssuer method', function () {
      expect(blockchainService.removeIssuer).to.be.a('function');
    });
  });

  describe('Error Handling', function () {
    it('should handle missing configuration gracefully', async function () {
      delete process.env.BLOCKCHAIN_PRIVATE_KEY;
      delete require.cache[require.resolve('../src/modules/certificates/blockchain-service')];
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const result = await blockchainService.initialize();
      expect(result).to.be.false;
      expect(blockchainService.isInitialized()).to.be.false;
    });

    it('should handle missing contract address gracefully', async function () {
      delete process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
      delete require.cache[require.resolve('../src/modules/certificates/blockchain-service')];
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const result = await blockchainService.initialize();
      expect(result).to.be.false;
      expect(blockchainService.isInitialized()).to.be.false;
    });

    it('should throw error when calling methods before initialization', async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      try {
        await blockchainService.issueCertificate('0x123', 'Student', 'Academic', '');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('not initialized');
      }
    });
  });
});
