const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");
const axios = require('axios');
const { logger } = require('../../config');
const { parsePaginationParams, parseSortingParams, buildPaginatedResponse } = require('../../utils/pagination');

/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     summary: Get all students
 *     description: Retrieve a paginated list of all students with optional filtering and sorting
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [id, name, email, lastLogin, className, roll]
 *           default: id
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: ASC
 *         description: Sort order
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by student name (partial match)
 *       - in: query
 *         name: className
 *         schema:
 *           type: string
 *         description: Filter by class name
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *         description: Filter by section name
 *       - in: query
 *         name: roll
 *         schema:
 *           type: string
 *         description: Filter by roll number
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
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Student'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     itemsPerPage:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 150
 *                     totalPages:
 *                       type: integer
 *                       example: 15
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *                     nextPage:
 *                       type: integer
 *                       example: 2
 *                     previousPage:
 *                       type: integer
 *                       example: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleGetAllStudents = asyncHandler(async (req, res) => {
    // Parse pagination and sorting parameters
    const pagination = parsePaginationParams(req.query, { defaultLimit: 10, maxLimit: 100 });
    const sorting = parseSortingParams(
        req.query, 
        ['id', 'name', 'email', 'lastLogin', 'className', 'roll'],
        'id',
        'ASC'
    );
    
    // Get filters
    const { name, className, section, roll } = req.query;
    const filters = { name, className, section, roll };
    
    // Create payload with pagination, sorting, and filters
    const payload = {
        ...filters,
        ...pagination,
        ...sorting
    };
    
    const result = await getAllStudents(payload);
    res.json(result);
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
