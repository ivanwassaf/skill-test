const { expect } = require('chai');
const sinon = require('sinon');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

describe('BlockchainService', function () {
  let blockchainService;
  let providerStub;
  let contractStub;
  let walletStub;
  let fsStub;

  beforeEach(function () {
    // Reset module cache to get fresh instance
    delete require.cache[require.resolve('../src/modules/certificates/blockchain-service')];
    
    // Stub environment variables
    process.env.BLOCKCHAIN_NETWORK = 'localhost';
    process.env.BLOCKCHAIN_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    process.env.BLOCKCHAIN_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    process.env.LOCALHOST_RPC_URL = 'http://127.0.0.1:8545';

    // Create stubs
    providerStub = {
      getBlockNumber: sinon.stub().resolves(100)
    };

    contractStub = {
      issueCertificate: sinon.stub(),
      verifyCertificate: sinon.stub(),
      getCertificate: sinon.stub(),
      getStudentCertificates: sinon.stub(),
      revokeCertificate: sinon.stub(),
      getTotalCertificates: sinon.stub(),
      waitForDeployment: sinon.stub().resolves()
    };

    walletStub = {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    };

    fsStub = sinon.stub(fs, 'existsSync').returns(true);
    sinon.stub(fs, 'readFileSync').returns(JSON.stringify([{"name": "issueCertificate"}]));
    sinon.stub(ethers, 'JsonRpcProvider').returns(providerStub);
    sinon.stub(ethers, 'Wallet').returns(walletStub);
    sinon.stub(ethers, 'Contract').returns(contractStub);
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('initialize', function () {
    it('should initialize successfully with valid configuration', async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      const result = await blockchainService.initialize();
      
      expect(result).to.be.true;
      expect(blockchainService.isInitialized()).to.be.true;
    });

    it('should return false when private key is missing', async function () {
      delete process.env.BLOCKCHAIN_PRIVATE_KEY;
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const result = await blockchainService.initialize();
      expect(result).to.be.false;
    });

    it('should return false when contract address is missing', async function () {
      delete process.env.BLOCKCHAIN_CONTRACT_ADDRESS;
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const result = await blockchainService.initialize();
      expect(result).to.be.false;
    });

    it('should return false when ABI file does not exist', async function () {
      fsStub.returns(false);
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const result = await blockchainService.initialize();
      expect(result).to.be.false;
    });

    it('should handle provider connection errors', async function () {
      providerStub.getBlockNumber.rejects(new Error('Connection failed'));
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      const result = await blockchainService.initialize();
      expect(result).to.be.false;
    });
  });

  describe('getRpcUrl', function () {
    it('should return localhost URL for localhost network', async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      const url = blockchainService.getRpcUrl('localhost');
      expect(url).to.equal('http://127.0.0.1:8545');
    });

    it('should return default localhost URL for unknown network', async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      const url = blockchainService.getRpcUrl('unknown');
      expect(url).to.equal('http://127.0.0.1:8545');
    });
  });

  describe('issueCertificate', function () {
    beforeEach(async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      await blockchainService.initialize();
    });

    it('should issue certificate successfully', async function () {
      const tx = {
        hash: '0xtxhash',
        wait: sinon.stub().resolves({ blockNumber: 100 })
      };
      contractStub.issueCertificate.resolves(tx);

      const result = await blockchainService.issueCertificate(
        '0xstudent',
        'John Doe',
        'john@test.com',
        'Academic Excellence',
        'QmHash123'
      );

      expect(result).to.have.property('certificateId');
      expect(result).to.have.property('transactionHash', '0xtxhash');
      expect(result).to.have.property('blockNumber', 100);
    });

    it('should throw error when not initialized', async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      
      try {
        await blockchainService.issueCertificate('0xstudent', 'Name', 'email', 'type', 'hash');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('not initialized');
      }
    });

    it('should handle transaction failures', async function () {
      contractStub.issueCertificate.rejects(new Error('Transaction failed'));

      try {
        await blockchainService.issueCertificate('0xstudent', 'Name', 'email', 'type', 'hash');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Transaction failed');
      }
    });
  });

  describe('verifyCertificate', function () {
    beforeEach(async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      await blockchainService.initialize();
    });

    it('should verify valid certificate', async function () {
      contractStub.verifyCertificate.resolves(true);

      const result = await blockchainService.verifyCertificate(1);
      expect(result).to.be.true;
    });

    it('should return false for invalid certificate', async function () {
      contractStub.verifyCertificate.resolves(false);

      const result = await blockchainService.verifyCertificate(999);
      expect(result).to.be.false;
    });
  });

  describe('getCertificate', function () {
    beforeEach(async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      await blockchainService.initialize();
    });

    it('should get certificate details', async function () {
      const certData = {
        id: 1,
        studentAddress: '0xstudent',
        studentName: 'John Doe',
        studentEmail: 'john@test.com',
        certificateType: 'Academic Excellence',
        ipfsHash: 'QmHash123',
        issuedAt: 1234567890,
        issuedBy: '0xissuer',
        revoked: false
      };
      contractStub.getCertificate.resolves(certData);

      const result = await blockchainService.getCertificate(1);
      expect(result.studentName).to.equal('John Doe');
      expect(result.certificateType).to.equal('Academic Excellence');
    });
  });

  describe('getStudentCertificates', function () {
    beforeEach(async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      await blockchainService.initialize();
    });

    it('should get all student certificates', async function () {
      contractStub.getStudentCertificates.resolves([1, 2, 3]);

      const result = await blockchainService.getStudentCertificates('0xstudent');
      expect(result).to.have.lengthOf(3);
    });
  });

  describe('revokeCertificate', function () {
    beforeEach(async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      await blockchainService.initialize();
    });

    it('should revoke certificate successfully', async function () {
      const tx = {
        hash: '0xtxhash',
        wait: sinon.stub().resolves({ blockNumber: 100 })
      };
      contractStub.revokeCertificate.resolves(tx);

      const result = await blockchainService.revokeCertificate(1);
      expect(result).to.have.property('transactionHash', '0xtxhash');
      expect(result).to.have.property('blockNumber', 100);
    });
  });

  describe('getTotalCertificates', function () {
    beforeEach(async function () {
      blockchainService = require('../src/modules/certificates/blockchain-service');
      await blockchainService.initialize();
    });

    it('should return total certificates count', async function () {
      contractStub.getTotalCertificates.resolves(42);

      const result = await blockchainService.getTotalCertificates();
      expect(result).to.equal(42);
    });
  });
});
