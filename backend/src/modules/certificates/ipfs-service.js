const axios = require('axios');
const FormData = require('form-data');
const logger = require('../../config/logger');

class IPFSService {
    constructor() {
        this.pinataApiKey = process.env.PINATA_API_KEY;
        this.pinataSecretKey = process.env.PINATA_SECRET_KEY;
        this.pinataBaseUrl = 'https://api.pinata.cloud';
        this.gatewayUrl = 'https://gateway.pinata.cloud/ipfs';
    }

    /**
     * Check if IPFS service is configured
     */
    isConfigured() {
        return !!(this.pinataApiKey && this.pinataSecretKey);
    }

    /**
     * Upload certificate metadata to IPFS
     */
    async uploadCertificateMetadata(certificateData) {
        if (!this.isConfigured()) {
            throw new Error('IPFS service not configured. Set PINATA_API_KEY and PINATA_SECRET_KEY');
        }

        try {
            const metadata = {
                name: `Certificate - ${certificateData.studentName}`,
                description: `Student Achievement Certificate`,
                certificateData: {
                    studentName: certificateData.studentName,
                    studentEmail: certificateData.studentEmail,
                    studentId: certificateData.studentId,
                    certificateType: certificateData.certificateType,
                    achievement: certificateData.achievement,
                    issuedDate: certificateData.issuedDate || new Date().toISOString(),
                    issuer: certificateData.issuer,
                    institution: certificateData.institution || 'School Management System',
                    additionalInfo: certificateData.additionalInfo || {}
                },
                attributes: [
                    {
                        trait_type: 'Certificate Type',
                        value: certificateData.certificateType
                    },
                    {
                        trait_type: 'Student Name',
                        value: certificateData.studentName
                    },
                    {
                        trait_type: 'Issue Date',
                        value: certificateData.issuedDate || new Date().toISOString()
                    }
                ]
            };

            const response = await axios.post(
                `${this.pinataBaseUrl}/pinning/pinJSONToIPFS`,
                metadata,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'pinata_api_key': this.pinataApiKey,
                        'pinata_secret_api_key': this.pinataSecretKey
                    }
                }
            );

            return {
                success: true,
                ipfsHash: response.data.IpfsHash,
                url: `${this.gatewayUrl}/${response.data.IpfsHash}`,
                timestamp: response.data.Timestamp
            };
        } catch (error) {
            logger.error('Error uploading to IPFS', { error: error.response?.data || error.message });
            throw new Error(`Failed to upload to IPFS: ${error.message}`);
        }
    }

    /**
     * Get certificate metadata from IPFS
     */
    async getCertificateMetadata(ipfsHash) {
        try {
            const response = await axios.get(`${this.gatewayUrl}/${ipfsHash}`);
            return response.data;
        } catch (error) {
            logger.error('Error fetching from IPFS', { error: error.message, ipfsHash });
            throw new Error(`Failed to fetch from IPFS: ${error.message}`);
        }
    }

    /**
     * Pin existing IPFS hash
     */
    async pinByHash(ipfsHash) {
        if (!this.isConfigured()) {
            throw new Error('IPFS service not configured');
        }

        try {
            await axios.post(
                `${this.pinataBaseUrl}/pinning/pinByHash`,
                {
                    hashToPin: ipfsHash
                },
                {
                    headers: {
                        'pinata_api_key': this.pinataApiKey,
                        'pinata_secret_api_key': this.pinataSecretKey
                    }
                }
            );

            return { success: true };
        } catch (error) {
            logger.error('Error pinning hash', { error: error.message, ipfsHash });
            throw new Error(`Failed to pin hash: ${error.message}`);
        }
    }

    /**
     * Unpin IPFS hash
     */
    async unpin(ipfsHash) {
        if (!this.isConfigured()) {
            throw new Error('IPFS service not configured');
        }

        try {
            await axios.delete(
                `${this.pinataBaseUrl}/pinning/unpin/${ipfsHash}`,
                {
                    headers: {
                        'pinata_api_key': this.pinataApiKey,
                        'pinata_secret_api_key': this.pinataSecretKey
                    }
                }
            );

            return { success: true };
        } catch (error) {
            logger.error('Error unpinning', { error: error.message, ipfsHash });
            throw new Error(`Failed to unpin: ${error.message}`);
        }
    }
}

// Create singleton instance
const ipfsService = new IPFSService();

module.exports = ipfsService;
