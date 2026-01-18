const { Pool } = require('pg');
const { logger } = require('../config');

// Create a connection pool for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of clients in the pool
  min: 2,  // Minimum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for acquiring connection (10 seconds)
  maxUses: 7500, // Close connection after 7500 uses
  allowExitOnIdle: false, // Keep pool alive even if no active connections
});

// Log pool events
pool.on('connect', () => {
  logger.debug('New client connected to the database pool');
});

pool.on('acquire', () => {
  logger.debug('Client acquired from pool');
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

pool.on('remove', () => {
  logger.debug('Client removed from pool');
});

/**
 * Execute a query with connection pooling
 * @param {string} query - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function query(query, params = []) {
  const start = Date.now();
  
  try {
    const result = await pool.query(query, params);
    const duration = Date.now() - start;
    
    // Log slow queries (> 100ms)
    if (duration > 100) {
      logger.warn('Slow query detected', {
        query: query.substring(0, 100),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    } else {
      logger.debug('Query executed', {
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error', {
      error: error.message,
      query: query.substring(0, 100),
    });
    throw error;
  }
}

/**
 * Execute a transaction with automatic rollback on error
 * @param {Function} callback - Function containing queries to execute
 * @returns {Promise<any>} Transaction result
 */
async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logger.debug('Transaction committed');
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get pool statistics
 * @returns {Object} Pool stats
 */
function getPoolStats() {
  return {
    total: pool.totalCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Close all connections in the pool
 */
async function closePool() {
  try {
    await pool.end();
    logger.info('Database connection pool closed');
  } catch (error) {
    logger.error('Error closing database pool', { error: error.message });
    throw error;
  }
}

/**
 * Check database connection health
 * @returns {Promise<boolean>}
 */
async function healthCheck() {
  try {
    const result = await pool.query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return false;
  }
}

module.exports = {
  pool,
  query,
  transaction,
  getPoolStats,
  closePool,
  healthCheck,
};
