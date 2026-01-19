const bus = require('../bus');
const {
  CreateStudentCommand,
  UpdateStudentCommand,
  DeleteStudentCommand,
} = require('./commands');
const {
  GetStudentByIdQuery,
  GetAllStudentsQuery,
  GetStudentsByClassQuery,
  SearchStudentsQuery,
} = require('./queries');
const {
  CreateStudentHandler,
  UpdateStudentHandler,
  DeleteStudentHandler,
  GetStudentByIdHandler,
  GetAllStudentsHandler,
  GetStudentsByClassHandler,
  SearchStudentsHandler,
} = require('./handlers');

/**
 * Register all student-related command and query handlers
 */
function registerStudentHandlers() {
  // Register Command Handlers
  bus.registerCommandHandler(CreateStudentCommand, new CreateStudentHandler());
  bus.registerCommandHandler(UpdateStudentCommand, new UpdateStudentHandler());
  bus.registerCommandHandler(DeleteStudentCommand, new DeleteStudentHandler());

  // Register Query Handlers
  bus.registerQueryHandler(GetStudentByIdQuery, new GetStudentByIdHandler());
  bus.registerQueryHandler(GetAllStudentsQuery, new GetAllStudentsHandler());
  bus.registerQueryHandler(GetStudentsByClassQuery, new GetStudentsByClassHandler());
  bus.registerQueryHandler(SearchStudentsQuery, new SearchStudentsHandler());
}

module.exports = {
  registerStudentHandlers,
  // Export commands and queries for use in controllers
  CreateStudentCommand,
  UpdateStudentCommand,
  DeleteStudentCommand,
  GetStudentByIdQuery,
  GetAllStudentsQuery,
  GetStudentsByClassQuery,
  SearchStudentsQuery,
};
