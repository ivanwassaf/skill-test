const blockchainService = require('./blockchain-service');
const ipfsService = require('./ipfs-service');
const { findStudentDetail } = require('../students/students-repository');

/**
 * Issue a certificate for a student
 */
const handleIssueCertificate = async (req, res) => {
    try {
        const { studentId, certificateType, achievement, additionalInfo } = req.body;

        // Validate required fields
        if (!studentId || !certificateType) {
            return res.status(400).json({
                success: false,
                message: 'Student ID and certificate type are required'
            });
        }

        // Check if blockchain is initialized
        if (!blockchainService.isInitialized()) {
            return res.status(503).json({
                success: false,
                message: 'Blockchain service not available. Please configure blockchain settings.'
            });
        }

        // Get student details
        const student = await findStudentDetail(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        // Prepare metadata
        const metadata = {
            studentName: student.name,
            studentEmail: student.email,
            studentId: studentId,
            certificateType: certificateType,
            achievement: achievement || certificateType,
            issuedDate: new Date().toISOString(),
            issuer: req.user.name || 'System Administrator',
            institution: 'School Management System',
            additionalInfo: additionalInfo || {}
        };

        // Upload metadata to IPFS (optional)
        let ipfsResult = null;
        if (ipfsService.isConfigured()) {
            try {
                ipfsResult = await ipfsService.uploadCertificateMetadata(metadata);
            } catch (error) {
                console.warn('⚠️  IPFS upload failed, continuing without IPFS:', error.message);
            }
        }

        // Issue certificate on blockchain
        // Note: For blockchain we need student's wallet address
        // If not available, generate a deterministic address based on student ID
        let studentAddress = student.wallet_address;
        if (!studentAddress) {
            // Generate a deterministic Ethereum address from student ID
            // This creates a valid address format but is NOT a real wallet
            const crypto = require('crypto');
            const hash = crypto.createHash('sha256').update(`student_${studentId}`).digest('hex');
            studentAddress = '0x' + hash.substring(0, 40); // Take first 20 bytes (40 hex chars)
        }
        
        const blockchainResult = await blockchainService.issueCertificate(
            studentAddress,
            metadata.studentName,
            metadata.studentEmail,
            certificateType,
            ipfsResult?.ipfsHash || ''
        );

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully',
            data: {
                certificateId: blockchainResult.certificateId,
                ipfsHash: ipfsResult?.ipfsHash || null,
                ipfsUrl: ipfsResult?.url || null,
                transactionHash: blockchainResult.transactionHash,
                blockNumber: blockchainResult.blockNumber,
                student: {
                    id: studentId,
                    name: metadata.studentName,
                    email: metadata.studentEmail
                }
            }
        });
    } catch (error) {
        console.error('Error issuing certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to issue certificate'
        });
    }
};

/**
 * Verify a certificate
 */
const handleVerifyCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        if (!blockchainService.isInitialized()) {
            return res.status(503).json({
                success: false,
                message: 'Blockchain service not available'
            });
        }

        const isValid = await blockchainService.verifyCertificate(certificateId);

        if (!isValid) {
            return res.status(200).json({
                success: true,
                valid: false,
                message: 'Certificate not found or has been revoked'
            });
        }

        const certificate = await blockchainService.getCertificate(certificateId);
        
        // Get metadata from IPFS
        let metadata = null;
        try {
            metadata = await ipfsService.getCertificateMetadata(certificate.ipfsHash);
        } catch (error) {
            console.error('Error fetching IPFS metadata:', error);
        }

        res.status(200).json({
            success: true,
            valid: true,
            data: {
                ...certificate,
                metadata: metadata
            }
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to verify certificate'
        });
    }
};

/**
 * Get certificate details
 */
const handleGetCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        if (!blockchainService.isInitialized()) {
            return res.status(503).json({
                success: false,
                message: 'Blockchain service not available'
            });
        }

        const certificate = await blockchainService.getCertificate(certificateId);

        // Get metadata from IPFS
        let metadata = null;
        try {
            metadata = await ipfsService.getCertificateMetadata(certificate.ipfsHash);
        } catch (error) {
            console.error('Error fetching IPFS metadata:', error);
        }

        res.status(200).json({
            success: true,
            data: {
                ...certificate,
                metadata: metadata,
                ipfsUrl: `https://gateway.pinata.cloud/ipfs/${certificate.ipfsHash}`
            }
        });
    } catch (error) {
        console.error('Error getting certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get certificate'
        });
    }
};

/**
 * Get all certificates for a student
 */
const handleGetStudentCertificates = async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student details
        const student = await findStudentDetail(studentId);
        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        if (!blockchainService.isInitialized()) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'Blockchain service not configured'
            });
        }

        // Get student's wallet address
        const studentAddress = student.wallet_address || '0x0000000000000000000000000000000000000000';

        const certificateIds = await blockchainService.getStudentCertificates(studentAddress);

        // Get details for each certificate
        const certificates = await Promise.all(
            certificateIds.map(async (id) => {
                try {
                    const cert = await blockchainService.getCertificate(id);
                    return cert;
                } catch (error) {
                    console.error(`Error fetching certificate ${id}:`, error);
                    return null;
                }
            })
        );

        res.status(200).json({
            success: true,
            data: certificates.filter(c => c !== null)
        });
    } catch (error) {
        console.error('Error getting student certificates:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get student certificates'
        });
    }
};

/**
 * Revoke a certificate
 */
const handleRevokeCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        if (!blockchainService.isInitialized()) {
            return res.status(503).json({
                success: false,
                message: 'Blockchain service not available'
            });
        }

        const result = await blockchainService.revokeCertificate(certificateId);

        res.status(200).json({
            success: true,
            message: 'Certificate revoked successfully',
            data: result
        });
    } catch (error) {
        console.error('Error revoking certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to revoke certificate'
        });
    }
};

/**
 * Get blockchain statistics
 */
const handleGetStats = async (req, res) => {
    try {
        if (!blockchainService.isInitialized()) {
            return res.status(200).json({
                success: true,
                data: {
                    initialized: false,
                    totalCertificates: 0
                }
            });
        }

        const totalCertificates = await blockchainService.getTotalCertificates();

        res.status(200).json({
            success: true,
            data: {
                initialized: true,
                totalCertificates: totalCertificates,
                network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
                contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to get statistics'
        });
    }
};

module.exports = {
    handleIssueCertificate,
    handleVerifyCertificate,
    handleGetCertificate,
    handleGetStudentCertificates,
    handleRevokeCertificate,
    handleGetStats
};
