const { bus } = require('../../cqrs');
const {
  CreateStudentCommand,
  UpdateStudentCommand,
  DeleteStudentCommand,
  GetStudentByIdQuery,
  GetAllStudentsQuery,
} = require('../../cqrs/students');

/**
 * CQRS-based Student Controller (Example)
 * Demonstrates separation of commands (writes) and queries (reads)
 */

/**
 * Get all students (Query)
 */
const getAllStudentsCQRS = async (req, res, next) => {
  try {
    const query = new GetAllStudentsQuery({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || 'id',
      sortOrder: req.query.sortOrder || 'ASC',
      search: req.query.search,
    });

    const students = await bus.executeQuery(query);

    res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student by ID (Query)
 */
const getStudentByIdCQRS = async (req, res, next) => {
  try {
    const query = new GetStudentByIdQuery(parseInt(req.params.id));
    const student = await bus.executeQuery(query);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'STUDENT_NOT_FOUND',
          message: 'Student not found',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create student (Command)
 */
const createStudentCQRS = async (req, res, next) => {
  try {
    const command = new CreateStudentCommand(req.body);
    const result = await bus.executeCommand(command);

    res.status(201).json({
      success: true,
      data: result,
      message: 'Student created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update student (Command)
 */
const updateStudentCQRS = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const command = new UpdateStudentCommand(studentId, req.body);
    
    const result = await bus.executeCommand(command);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Student updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete student (Command)
 */
const deleteStudentCQRS = async (req, res, next) => {
  try {
    const studentId = parseInt(req.params.id);
    const command = new DeleteStudentCommand(studentId);
    
    await bus.executeCommand(command);

    res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllStudentsCQRS,
  getStudentByIdCQRS,
  createStudentCQRS,
  updateStudentCQRS,
  deleteStudentCQRS,
};
