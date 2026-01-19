const bus = require('./bus');
const { registerStudentHandlers } = require('./students');
const logger = require('../config/logger');

/**
 * Initialize CQRS infrastructure
 * Registers all command and query handlers
 */
function initializeCQRS() {
  logger.info('Initializing CQRS infrastructure...');

  // Add logging middleware
  bus.use(async ({ type, payload }) => {
    logger.debug(`CQRS ${type} dispatched`, {
      name: payload.constructor.name,
      id: payload.id,
    });
  });

  // Register all module handlers
  registerStudentHandlers();

  logger.info('CQRS infrastructure initialized');
}

module.exports = {
  initializeCQRS,
  bus,
};
