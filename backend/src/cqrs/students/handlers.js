const { CommandHandler, QueryHandler } = require('../base');
const { studentsRepository } = require('../../modules/students/students-repository');
const logger = require('../../config/logger');

/**
 * Create Student Command Handler
 */
class CreateStudentHandler extends CommandHandler {
  async handle(command) {
    logger.debug('Creating student', { name: command.name, email: command.email });
    
    // Business logic for creating student
    const studentData = {
      name: command.name,
      email: command.email,
      phone: command.phone,
      section_id: command.sectionId,
      class_id: command.classId,
      department_id: command.departmentId,
    };

    const result = await studentsRepository.addStudent(studentData);
    
    // Could emit events here for event sourcing
    // eventBus.emit('StudentCreated', { id: result.id, ...studentData });
    
    return result;
  }
}

/**
 * Update Student Command Handler
 */
class UpdateStudentHandler extends CommandHandler {
  async handle(command) {
    logger.debug('Updating student', { studentId: command.studentId });
    
    const result = await studentsRepository.updateStudent(
      command.studentId,
      command.updateData
    );
    
    // eventBus.emit('StudentUpdated', { id: command.studentId, ...command.updateData });
    
    return result;
  }
}

/**
 * Delete Student Command Handler
 */
class DeleteStudentHandler extends CommandHandler {
  async handle(command) {
    logger.debug('Deleting student', { studentId: command.studentId });
    
    const result = await studentsRepository.removeStudent(command.studentId);
    
    // eventBus.emit('StudentDeleted', { id: command.studentId });
    
    return result;
  }
}

/**
 * Get Student By ID Query Handler
 */
class GetStudentByIdHandler extends QueryHandler {
  async handle(query) {
    return await studentsRepository.getStudentById(query.studentId);
  }
}

/**
 * Get All Students Query Handler
 */
class GetAllStudentsHandler extends QueryHandler {
  async handle(query) {
    return await studentsRepository.getAllStudents({
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
    });
  }
}

/**
 * Get Students By Class Query Handler
 */
class GetStudentsByClassHandler extends QueryHandler {
  async handle(query) {
    return await studentsRepository.getStudentsByClass(query.classId);
  }
}

/**
 * Search Students Query Handler
 */
class SearchStudentsHandler extends QueryHandler {
  async handle(query) {
    return await studentsRepository.searchStudents(query.searchTerm);
  }
}

module.exports = {
  // Command Handlers
  CreateStudentHandler,
  UpdateStudentHandler,
  DeleteStudentHandler,
  // Query Handlers
  GetStudentByIdHandler,
  GetAllStudentsHandler,
  GetStudentsByClassHandler,
  SearchStudentsHandler,
};
