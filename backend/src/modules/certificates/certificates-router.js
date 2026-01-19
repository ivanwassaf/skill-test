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
const { cacheMiddleware, invalidateCache, cachePatterns } = require('../../middlewares/cache-middleware');

const router = Router();

// Public routes (no authentication required)
router.get('/health', handleGetHealth);
router.post('/verify', handleVerifyCertificate); // Don't cache verify (always fresh)

// Protected routes with cache (TTL: 10 minutes for certificates - they rarely change)
router.post('/issue', 
  authenticateToken, 
  invalidateCache([
    cachePatterns.certificates.all,
    (req) => cachePatterns.certificates.student(req.body.studentId)
  ]),
  handleIssueCertificate
);

router.get('/student/:studentId', 
  authenticateToken, 
  cacheMiddleware(600, (req) => `cache:certificates:student:${req.params.studentId}`),
  handleGetStudentCertificates
);

router.get('/stats', 
  authenticateToken, 
  cacheMiddleware(300, () => 'cache:certificates:stats'), // Cache stats for 5 min
  handleGetStats
);

router.post('/:certificateId/revoke', 
  authenticateToken, 
  invalidateCache([
    cachePatterns.certificates.all,
    (req) => cachePatterns.certificates.detail(req.params.certificateId)
  ]),
  handleRevokeCertificate
);

// Dynamic routes - must come last
router.get('/:certificateId', 
  cacheMiddleware(600, (req) => cachePatterns.certificates.detail(req.params.certificateId)),
  handleGetCertificate
);

module.exports = router;
