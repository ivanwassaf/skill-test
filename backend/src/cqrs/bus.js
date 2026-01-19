const logger = require('../config/logger');

/**
 * Command/Query Bus
 * Dispatches commands and queries to their respective handlers
 */
class Bus {
  constructor() {
    this.commandHandlers = new Map();
    this.queryHandlers = new Map();
    this.middlewares = [];
  }

  /**
   * Register a command handler
   */
  registerCommandHandler(commandClass, handler) {
    const commandName = commandClass.name;
    if (this.commandHandlers.has(commandName)) {
      throw new Error(`Command handler for ${commandName} already registered`);
    }
    this.commandHandlers.set(commandName, handler);
    logger.debug(`Registered command handler: ${commandName}`);
  }

  /**
   * Register a query handler
   */
  registerQueryHandler(queryClass, handler) {
    const queryName = queryClass.name;
    if (this.queryHandlers.has(queryName)) {
      throw new Error(`Query handler for ${queryName} already registered`);
    }
    this.queryHandlers.set(queryName, handler);
    logger.debug(`Registered query handler: ${queryName}`);
  }

  /**
   * Add middleware for logging, validation, etc.
   */
  use(middleware) {
    this.middlewares.push(middleware);
  }

  /**
   * Execute a command
   */
  async executeCommand(command) {
    const commandName = command.constructor.name;
    const handler = this.commandHandlers.get(commandName);

    if (!handler) {
      throw new Error(`No handler registered for command: ${commandName}`);
    }

    // Validate command
    if (typeof command.validate === 'function') {
      command.validate();
    }

    // Apply middlewares
    for (const middleware of this.middlewares) {
      await middleware({ type: 'command', payload: command });
    }

    // Log command execution
    logger.info(`Executing command: ${commandName}`, {
      commandId: command.id,
      timestamp: command.timestamp,
    });

    // Execute handler
    const startTime = Date.now();
    try {
      const result = await handler.handle(command);
      const duration = Date.now() - startTime;
      
      logger.info(`Command executed successfully: ${commandName}`, {
        commandId: command.id,
        duration: `${duration}ms`,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Command execution failed: ${commandName}`, {
        commandId: command.id,
        duration: `${duration}ms`,
        error: error.message,
      });
      
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async executeQuery(query) {
    const queryName = query.constructor.name;
    const handler = this.queryHandlers.get(queryName);

    if (!handler) {
      throw new Error(`No handler registered for query: ${queryName}`);
    }

    // Validate query
    if (typeof query.validate === 'function') {
      query.validate();
    }

    // Apply middlewares
    for (const middleware of this.middlewares) {
      await middleware({ type: 'query', payload: query });
    }

    // Log query execution
    logger.debug(`Executing query: ${queryName}`, {
      queryId: query.id,
      timestamp: query.timestamp,
    });

    // Execute handler
    const startTime = Date.now();
    try {
      const result = await handler.handle(query);
      const duration = Date.now() - startTime;
      
      logger.debug(`Query executed successfully: ${queryName}`, {
        queryId: query.id,
        duration: `${duration}ms`,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error(`Query execution failed: ${queryName}`, {
        queryId: query.id,
        duration: `${duration}ms`,
        error: error.message,
      });
      
      throw error;
    }
  }
}

// Singleton instance
const bus = new Bus();

module.exports = bus;
