const { Query } = require('../base');

/**
 * Get Student By ID Query
 */
class GetStudentByIdQuery extends Query {
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

/**
 * Get All Students Query
 */
class GetAllStudentsQuery extends Query {
  constructor(filters = {}) {
    super(filters);
    this.page = filters.page || 1;
    this.limit = filters.limit || 10;
    this.sortBy = filters.sortBy || 'id';
    this.sortOrder = filters.sortOrder || 'ASC';
    this.search = filters.search;
  }

  validate() {
    if (this.page < 1) {
      throw new Error('Page must be greater than 0');
    }
    if (this.limit < 1 || this.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
  }
}

/**
 * Get Students By Class Query
 */
class GetStudentsByClassQuery extends Query {
  constructor(classId) {
    super({ classId });
    this.classId = classId;
  }

  validate() {
    if (!this.classId) {
      throw new Error('Class ID is required');
    }
  }
}

/**
 * Search Students Query
 */
class SearchStudentsQuery extends Query {
  constructor(searchTerm) {
    super({ searchTerm });
    this.searchTerm = searchTerm;
  }

  validate() {
    if (!this.searchTerm || this.searchTerm.trim().length < 2) {
      throw new Error('Search term must be at least 2 characters');
    }
  }
}

module.exports = {
  GetStudentByIdQuery,
  GetAllStudentsQuery,
  GetStudentsByClassQuery,
  SearchStudentsQuery,
};
