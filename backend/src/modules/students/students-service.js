const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const { findAllStudents, countStudents, findStudentDetail, findStudentToSetStatus, addOrUpdateStudent } = require("./students-repository");
const { findUserById } = require("../../shared/repository");
const { buildPaginatedResponse } = require("../../utils/pagination");

const checkStudentId = async (id) => {
    const isStudentFound = await findUserById(id);
    if (!isStudentFound) {
        throw new ApiError(404, "Student not found");
    }
}

const getAllStudents = async (payload) => {
    const { page, limit } = payload;
    
    // Get students and total count in parallel for better performance
    const [students, total] = await Promise.all([
        findAllStudents(payload),
        countStudents(payload)
    ]);
    
    // Return paginated response with metadata
    return buildPaginatedResponse(students, page, limit, total);
}

const getStudentDetail = async (id) => {
    await checkStudentId(id);

    const student = await findStudentDetail(id);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return student;
}

const addNewStudent = async (payload) => {
    const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS = "Student added and verification email sent successfully.";
    const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL = "Student added, but failed to send verification email.";
    
    const result = await addOrUpdateStudent(payload);
    if (!result.status) {
        throw new ApiError(500, result.message);
    }

    try {
        await sendAccountVerificationEmail({ userId: result.userId, userEmail: payload.email });
        return { message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS };
    } catch (error) {
        return { message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL }
    }
}

const updateStudent = async (payload) => {
    const result = await addOrUpdateStudent(payload);
    if (!result.status) {
        throw new ApiError(500, result.message);
    }

    return { message: result.message };
}

const setStudentStatus = async ({ userId, reviewerId, status }) => {
    await checkStudentId(userId);

    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to disable student");
    }

    return { message: "Student status changed successfully" };
}

module.exports = {
    getAllStudents,
    getStudentDetail,
    addNewStudent,
    setStudentStatus,
    updateStudent,
};
