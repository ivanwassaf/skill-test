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

// Protected routes (authentication required) - must come before /:certificateId
router.post('/issue', authenticateToken, handleIssueCertificate);
router.get('/student/:studentId', authenticateToken, handleGetStudentCertificates);
router.get('/stats', authenticateToken, handleGetStats);
router.post('/:certificateId/revoke', authenticateToken, handleRevokeCertificate);

// Dynamic routes - must come last
router.get('/:certificateId', handleGetCertificate);

module.exports = router;
