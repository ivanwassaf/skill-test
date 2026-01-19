const { Command } = require('../base');

/**
 * Create Student Command
 * Represents the intent to create a new student
 */
class CreateStudentCommand extends Command {
  constructor(studentData) {
    super(studentData);
    this.name = studentData.name;
    this.email = studentData.email;
    this.phone = studentData.phone;
    this.sectionId = studentData.section_id;
    this.classId = studentData.class_id;
    this.departmentId = studentData.department_id;
  }

  validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Student name is required');
    }
    if (!this.email || !this.email.includes('@')) {
      throw new Error('Valid email is required');
    }
    if (!this.sectionId || !this.classId || !this.departmentId) {
      throw new Error('Section, class, and department are required');
    }
  }
}

/**
 * Update Student Command
 */
class UpdateStudentCommand extends Command {
  constructor(studentId, updateData) {
    super({ studentId, ...updateData });
    this.studentId = studentId;
    this.updateData = updateData;
  }

  validate() {
    if (!this.studentId) {
      throw new Error('Student ID is required');
    }
    if (!this.updateData || Object.keys(this.updateData).length === 0) {
      throw new Error('Update data cannot be empty');
    }
  }
}

/**
 * Delete Student Command
 */
class DeleteStudentCommand extends Command {
  constructor(studentId) {
    super({ studentId });
    this.studentId = studentId;
  }

  validate() {
    if (!this.studentId) {
      throw new Error('Student ID is required');
    }
  }
}

module.exports = {
  CreateStudentCommand,
  UpdateStudentCommand,
  DeleteStudentCommand,
};
