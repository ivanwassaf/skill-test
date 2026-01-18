/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and authorization endpoints
 *   - name: Students
 *     description: Student management operations
 *   - name: Certificates
 *     description: Blockchain certificate operations
 *   - name: Classes
 *     description: Class and section management
 *   - name: Staff
 *     description: Staff management operations
 *   - name: Dashboard
 *     description: Dashboard and statistics
 */

/**
 * @swagger
 * /api/v1/certificates:
 *   post:
 *     summary: Issue a new certificate
 *     description: Create and issue a blockchain certificate for a student with IPFS metadata
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - certificateType
 *             properties:
 *               studentId:
 *                 type: integer
 *                 description: ID of the student receiving the certificate
 *                 example: 1
 *               certificateType:
 *                 type: string
 *                 description: Type of certificate
 *                 example: Academic Excellence
 *               achievement:
 *                 type: string
 *                 description: Achievement description
 *                 example: Outstanding performance in Mathematics
 *               additionalInfo:
 *                 type: object
 *                 description: Additional metadata
 *                 properties:
 *                   grade:
 *                     type: string
 *                     example: A+
 *                   year:
 *                     type: string
 *                     example: "2024"
 *     responses:
 *       201:
 *         description: Certificate issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Certificate issued successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificateId:
 *                       type: integer
 *                       example: 1
 *                     ipfsHash:
 *                       type: string
 *                       nullable: true
 *                       example: QmX7vH5YzKjN9KmZqr1a2b3c4d5e6f7g8h9i0j
 *                     ipfsUrl:
 *                       type: string
 *                       nullable: true
 *                       example: https://gateway.pinata.cloud/ipfs/QmX7vH5YzKjN9...
 *                     transactionHash:
 *                       type: string
 *                       example: 0x1234567890abcdef...
 *                     blockNumber:
 *                       type: integer
 *                       example: 12345
 *                     student:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: John Doe
 *                         email:
 *                           type: string
 *                           example: john.doe@school.com
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Student not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Blockchain service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Blockchain service not available
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/certificates/verify/{certificateId}:
 *   get:
 *     summary: Verify a certificate
 *     description: Verify the authenticity of a certificate on the blockchain (public endpoint)
 *     tags: [Certificates]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID to verify
 *         example: 1
 *     responses:
 *       200:
 *         description: Certificate verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     certificateId:
 *                       type: integer
 *                       example: 1
 *                     studentName:
 *                       type: string
 *                       example: John Doe
 *                     certificateType:
 *                       type: string
 *                       example: Academic Excellence
 *                     issuedDate:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-15T10:30:00Z
 *                     revoked:
 *                       type: boolean
 *                       example: false
 *                     ipfsHash:
 *                       type: string
 *                       nullable: true
 *                       example: QmX7vH5YzKjN9...
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       503:
 *         description: Blockchain service unavailable
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/certificates/details/{certificateId}:
 *   get:
 *     summary: Get certificate details
 *     description: Retrieve detailed information about a certificate (public endpoint)
 *     tags: [Certificates]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Certificate details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Certificate'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       503:
 *         description: Blockchain service unavailable
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/certificates/student/{studentId}:
 *   get:
 *     summary: Get student certificates
 *     description: Retrieve all certificates issued to a specific student
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Student certificates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Certificate'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Student not found
 *       503:
 *         description: Blockchain service unavailable
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/certificates/{certificateId}/revoke:
 *   post:
 *     summary: Revoke a certificate
 *     description: Revoke a previously issued certificate on the blockchain
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Certificate ID to revoke
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for revocation
 *                 example: Certificate issued in error
 *     responses:
 *       200:
 *         description: Certificate revoked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Certificate revoked successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionHash:
 *                       type: string
 *                       example: 0xabcdef1234567890...
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       503:
 *         description: Blockchain service unavailable
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/certificates/stats:
 *   get:
 *     summary: Get certificate statistics
 *     description: Retrieve statistics about issued certificates
 *     tags: [Certificates]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalCertificates:
 *                       type: integer
 *                       example: 150
 *                     revokedCertificates:
 *                       type: integer
 *                       example: 5
 *                     activeCertificates:
 *                       type: integer
 *                       example: 145
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       503:
 *         description: Blockchain service unavailable
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     summary: Get dashboard data
 *     description: Retrieve dashboard statistics and summary information
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalStudents:
 *                       type: integer
 *                       example: 500
 *                     totalStaff:
 *                       type: integer
 *                       example: 50
 *                     totalClasses:
 *                       type: integer
 *                       example: 20
 *                     totalCertificates:
 *                       type: integer
 *                       example: 150
 *                     recentActivities:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API server is running and healthy
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2024-01-15T10:30:00Z
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 *                   description: Server uptime in seconds
 *                 environment:
 *                   type: string
 *                   example: development
 */
