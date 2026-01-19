/**
 * CQRS Base Command
 * All commands (write operations) should extend this class
 */
class Command {
  constructor(data) {
    this.data = data;
    this.timestamp = new Date();
    this.id = this.generateId();
  }

  generateId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate() {
    throw new Error('validate() must be implemented by subclass');
  }
}

/**
 * CQRS Base Query
 * All queries (read operations) should extend this class
 */
class Query {
  constructor(criteria) {
    this.criteria = criteria;
    this.timestamp = new Date();
    this.id = this.generateId();
  }

  generateId() {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  validate() {
    throw new Error('validate() must be implemented by subclass');
  }
}

/**
 * Command Handler Interface
 */
class CommandHandler {
  async handle(command) {
    throw new Error('handle() must be implemented by subclass');
  }
}

/**
 * Query Handler Interface
 */
class QueryHandler {
  async handle(query) {
    throw new Error('handle() must be implemented by subclass');
  }
}

module.exports = {
  Command,
  Query,
  CommandHandler,
  QueryHandler,
};
