const { Router } = require('express');
const {
    handleIssueCertificate,
    handleVerifyCertificate,
    handleGetCertificate,
    handleGetStudentCertificates,
    handleRevokeCertificate,
    handleGetStats,
    handleGetHealth
} = require('./certificates-controller');
const { authenticateToken } = require('../../middlewares');

const router = Router();

// Public routes (no authentication required)
router.get('/health', handleGetHealth);
router.post('/verify', handleVerifyCertificate);
router.get('/:certificateId', handleGetCertificate);

// Protected routes (authentication required)
router.post('/issue', authenticateToken, handleIssueCertificate);
router.get('/student/:studentId', authenticateToken, handleGetStudentCertificates);
router.post('/:certificateId/revoke', authenticateToken, handleRevokeCertificate);
router.get('/stats', authenticateToken, handleGetStats);

module.exports = router;
