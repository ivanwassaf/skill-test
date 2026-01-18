const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");
const axios = require('axios');
const { logger } = require('../../config');

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: Get all students
 *     description: Retrieve a list of all students with optional filtering
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *         description: Filter by class ID
 *       - in: query
 *         name: section_id
 *         schema:
 *           type: integer
 *         description: Filter by section ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by student status
 *     responses:
 *       200:
 *         description: List of students retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 students:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleGetAllStudents = asyncHandler(async (req, res) => {
    const payload = req.query;
    const students = await getAllStudents(payload);
    res.json({ students });
});

/**
 * @swagger
 * /api/v1/students:
 *   post:
 *     summary: Add new student
 *     description: Create a new student record
 *     tags: [Students]
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
 *               - first_name
 *               - last_name
 *               - email
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@school.com
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: 2005-01-15
 *               address:
 *                 type: string
 *                 example: 123 Main Street
 *               phone_number:
 *                 type: string
 *                 example: +1234567890
 *               class_id:
 *                 type: integer
 *                 example: 1
 *               section_id:
 *                 type: integer
 *                 example: 1
 *               admission_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *     responses:
 *       201:
 *         description: Student created successfully
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
 *                   example: Student added successfully
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: Student with email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleAddStudent = asyncHandler(async (req, res) => {
    const payload = req.body;
    logger.debug('Adding student', { payload });
    const message = await addNewStudent(payload);
    res.json(message);
});

const handleUpdateStudent = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payload = req.body;
    const message = await updateStudent({ ...payload, id });
    res.json(message);
});

/**
 * @swagger
 * /api/v1/students/{id}:
 *   get:
 *     summary: Get student details
 *     description: Retrieve detailed information about a specific student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Student details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleGetStudentDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const student = await getStudentDetail(id);
    res.json(student);
});

const handleStudentStatus = asyncHandler(async (req, res) => {
    const { id: userId } = req.params;
    const { id: reviewerId } = req.user;
    const { status } = req.body;
    const message = await setStudentStatus({ userId, reviewerId, status });
    res.json(message);
});

const handleGeneratePDFReport = asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.info('Generating PDF report', { studentId: id });
    
    // Get student data (this already validates authentication)
    const student = await getStudentDetail(id);
    logger.debug('Student data retrieved', { studentName: student.name });
    
    // Call Go PDF service with student data
    const pdfServiceUrl = process.env.PDF_SERVICE_URL || 'http://pdf-service:8080';
    logger.debug('PDF Service URL', { url: pdfServiceUrl });
    
    try {
        const response = await axios.post(
            `${pdfServiceUrl}/api/v1/generate-pdf`,
            student,
            {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );
        
        logger.info('PDF generated successfully', { size: response.data.length });
        
        // Send PDF back to client
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename=student_${id}_report.pdf`
        });
        res.send(response.data);
    } catch (error) {
        logger.error('Error calling PDF service', { 
            error: error.message,
            status: error.response?.status,
            data: error.response?.data
        });
        throw new Error('Failed to generate PDF report');
    }
});

module.exports = {
    handleGetAllStudents,
    handleGetStudentDetail,
    handleAddStudent,
    handleStudentStatus,
    handleUpdateStudent,
    handleGeneratePDFReport,
};
