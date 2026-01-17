const { Router } = require('express');
const {
    handleIssueCertificate,
    handleVerifyCertificate,
    handleGetCertificate,
    handleGetStudentCertificates,
    handleRevokeCertificate,
    handleGetStats
} = require('./certificates-controller');
const { authenticateToken } = require('../../middlewares');

const router = Router();

// Public routes (no authentication required)
router.get('/verify/:certificateId', handleVerifyCertificate);
router.get('/details/:certificateId', handleGetCertificate);

// Protected routes (authentication required)
router.post('/', authenticateToken, handleIssueCertificate);
router.get('/student/:studentId', authenticateToken, handleGetStudentCertificates);
router.post('/:certificateId/revoke', authenticateToken, handleRevokeCertificate);
router.get('/stats', authenticateToken, handleGetStats);

module.exports = router;
