const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');

class BlockchainService {
    constructor() {
        this.provider = null;
        this.contract = null;
        this.wallet = null;
        this.initialized = false;
    }

    /**
     * Initialize blockchain connection
     */
    async initialize() {
        try {
            // Get network configuration from environment
            const network = process.env.BLOCKCHAIN_NETWORK || 'localhost';
            const rpcUrl = this.getRpcUrl(network);
            const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
            const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS;

            if (!privateKey || !contractAddress) {
                console.warn('⚠️  Blockchain not configured. Set BLOCKCHAIN_PRIVATE_KEY and BLOCKCHAIN_CONTRACT_ADDRESS');
                return false;
            }

            // Initialize provider
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            
            // Initialize wallet
            this.wallet = new ethers.Wallet(privateKey, this.provider);

            // Load contract ABI
            const abiPath = path.join(__dirname, '../../../StudentCertificate.abi.json');
            
            if (!fs.existsSync(abiPath)) {
                console.warn('⚠️  Contract ABI not found. Deploy the contract first.');
                return false;
            }

            const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

            // Initialize contract
            this.contract = new ethers.Contract(contractAddress, abi, this.wallet);

            // Verify connection
            await this.provider.getBlockNumber();
            
            this.initialized = true;
            console.log('✅ Blockchain service initialized on', network);
            console.log('📍 Contract address:', contractAddress);
            console.log('👤 Wallet address:', this.wallet.address);

            return true;
        } catch (error) {
            console.error('❌ Failed to initialize blockchain:', error.message);
            return false;
        }
    }

    /**
     * Get RPC URL based on network
     */
    getRpcUrl(network) {
        const urls = {
            localhost: process.env.LOCALHOST_RPC_URL || 'http://127.0.0.1:8545',
            sepolia: process.env.SEPOLIA_RPC_URL,
            polygon: process.env.POLYGON_RPC_URL,
            mumbai: process.env.MUMBAI_RPC_URL
        };

        return urls[network] || urls.localhost;
    }

    /**
     * Check if service is initialized
     */
    isInitialized() {
        return this.initialized;
    }

    /**
     * Issue a new certificate
     */
    async issueCertificate(studentAddress, studentName, studentEmail, certificateType, ipfsHash) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const tx = await this.contract.issueCertificate(
                studentAddress,
                studentName,
                studentEmail,
                certificateType,
                ipfsHash
            );

            const receipt = await tx.wait();
            
            // Extract certificate ID from event
            const event = receipt.logs
                .map(log => {
                    try {
                        return this.contract.interface.parseLog(log);
                    } catch {
                        return null;
                    }
                })
                .find(e => e && e.name === 'CertificateIssued');

            const certificateId = event ? event.args.certificateId : null;

            return {
                success: true,
                certificateId: certificateId ? certificateId.toString() : null,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error issuing certificate:', error);
            throw new Error(`Failed to issue certificate: ${error.message}`);
        }
    }

    /**
     * Verify a certificate by ID
     */
    async verifyCertificate(certificateId) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const isValid = await this.contract.verifyCertificate(certificateId);
            return isValid;
        } catch (error) {
            console.error('Error verifying certificate:', error);
            return false;
        }
    }

    /**
     * Get certificate details
     */
    async getCertificate(certificateId) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const cert = await this.contract.getCertificate(certificateId);
            
            return {
                id: cert.id.toString(),
                studentAddress: cert.studentAddress,
                studentName: cert.studentName,
                studentEmail: cert.studentEmail,
                certificateType: cert.certificateType,
                ipfsHash: cert.ipfsHash,
                issuedAt: new Date(Number(cert.issuedAt) * 1000).toISOString(),
                issuedBy: cert.issuedBy,
                revoked: cert.revoked
            };
        } catch (error) {
            console.error('Error getting certificate:', error);
            throw new Error(`Failed to get certificate: ${error.message}`);
        }
    }

    /**
     * Get all certificates for a student
     */
    async getStudentCertificates(studentAddress) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const certIds = await this.contract.getStudentCertificates(studentAddress);
            return certIds.map(id => id.toString());
        } catch (error) {
            console.error('Error getting student certificates:', error);
            return [];
        }
    }

    /**
     * Revoke a certificate
     */
    async revokeCertificate(certificateId) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const tx = await this.contract.revokeCertificate(certificateId);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Error revoking certificate:', error);
            throw new Error(`Failed to revoke certificate: ${error.message}`);
        }
    }

    /**
     * Verify certificate by IPFS hash
     */
    async verifyCertificateByHash(ipfsHash) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const [isValid, certId] = await this.contract.verifyCertificateByHash(ipfsHash);
            return {
                isValid,
                certificateId: certId ? certId.toString() : null
            };
        } catch (error) {
            console.error('Error verifying by hash:', error);
            return { isValid: false, certificateId: null };
        }
    }

    /**
     * Get total certificates count
     */
    async getTotalCertificates() {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const total = await this.contract.getTotalCertificates();
            return total.toString();
        } catch (error) {
            console.error('Error getting total certificates:', error);
            return '0';
        }
    }

    /**
     * Add a new issuer (admin only)
     */
    async addIssuer(issuerAddress) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const tx = await this.contract.addIssuer(issuerAddress);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Error adding issuer:', error);
            throw new Error(`Failed to add issuer: ${error.message}`);
        }
    }

    /**
     * Remove an issuer (admin only)
     */
    async removeIssuer(issuerAddress) {
        if (!this.initialized) {
            throw new Error('Blockchain service not initialized');
        }

        try {
            const tx = await this.contract.removeIssuer(issuerAddress);
            const receipt = await tx.wait();

            return {
                success: true,
                transactionHash: receipt.hash
            };
        } catch (error) {
            console.error('Error removing issuer:', error);
            throw new Error(`Failed to remove issuer: ${error.message}`);
        }
    }
}

// Create singleton instance
const blockchainService = new BlockchainService();

module.exports = blockchainService;
