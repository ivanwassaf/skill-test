const asyncHandler = require("express-async-handler");
const { getAllStudents, addNewStudent, getStudentDetail, setStudentStatus, updateStudent } = require("./students-service");
const axios = require('axios');

const handleGetAllStudents = asyncHandler(async (req, res) => {
    const payload = req.query;
    const students = await getAllStudents(payload);
    res.json({ students });
});

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
