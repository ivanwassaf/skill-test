/**
 * Custom Application Error Class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error types
 */
class BadRequestError extends AppError {
  constructor(message = 'Bad Request', code = 'BAD_REQUEST', details = null) {
    super(message, 400, code, details);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code = 'UNAUTHORIZED', details = null) {
    super(message, 401, code, details);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN', details = null) {
    super(message, 403, code, details);
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND', details = null) {
    super(message, 404, code, details);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT', details = null) {
    super(message, 409, code, details);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', code = 'VALIDATION_ERROR', details = null) {
    super(message, 422, code, details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Service unavailable', code = 'SERVICE_UNAVAILABLE', details = null) {
    super(message, 503, code, details);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  ServiceUnavailableError,
};
