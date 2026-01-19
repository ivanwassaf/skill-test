const redis = require('redis');
const logger = require('./logger');

let redisClient = null;
let isConnected = false;

/**
 * Initialize Redis client
 */
async function initializeRedis() {
  if (!process.env.REDIS_ENABLED || process.env.REDIS_ENABLED !== 'true') {
    logger.info('ℹ️  Redis caching is disabled');
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.error('Redis reconnection failed after 10 attempts');
            return new Error('Redis reconnection limit exceeded');
          }
          // Exponential backoff: 100ms, 200ms, 400ms, 800ms...
          const delay = Math.min(100 * Math.pow(2, retries), 3000);
          logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries + 1})`);
          return delay;
        },
      },
    });

    // Event handlers
    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
      isConnected = false;
    });

    redisClient.on('connect', () => {
      logger.info('🔄 Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis client ready');
      isConnected = true;
    });

    redisClient.on('end', () => {
      logger.warn('⚠️  Redis client disconnected');
      isConnected = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('🔄 Redis client reconnecting...');
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    logger.info('✅ Redis cache initialized successfully', { url: redisUrl });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message });
    logger.warn('ℹ️  Continuing without Redis cache');
    redisClient = null;
    isConnected = false;
    return null;
  }
}

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached value or null
 */
async function getCache(key) {
  if (!redisClient || !isConnected) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    if (value) {
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    }
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.error('Error getting cache', { key, error: error.message });
    return null;
  }
}

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @returns {Promise<boolean>} - Success status
 */
async function setCache(key, value, ttl = 300) {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    await redisClient.setEx(key, ttl, serialized);
    logger.debug('Cache set', { key, ttl });
    return true;
  } catch (error) {
    logger.error('Error setting cache', { key, error: error.message });
    return false;
  }
}

/**
 * Delete a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCache(key) {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.error('Error deleting cache', { key, error: error.message });
    return false;
  }
}

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., 'students:*')
 * @returns {Promise<number>} - Number of deleted keys
 */
async function deletePattern(pattern) {
  if (!redisClient || !isConnected) {
    return 0;
  }

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    
    const deleted = await redisClient.del(keys);
    logger.debug('Cache pattern deleted', { pattern, count: deleted });
    return deleted;
  } catch (error) {
    logger.error('Error deleting cache pattern', { pattern, error: error.message });
    return 0;
  }
}

/**
 * Clear all cache
 * @returns {Promise<boolean>} - Success status
 */
async function clearCache() {
  if (!redisClient || !isConnected) {
    return false;
  }

  try {
    await redisClient.flushDb();
    logger.info('Cache cleared');
    return true;
  } catch (error) {
    logger.error('Error clearing cache', { error: error.message });
    return false;
  }
}

/**
 * Close Redis connection
 */
async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      logger.info('Redis connection closed');
    } catch (error) {
      logger.error('Error closing Redis', { error: error.message });
    }
  }
}

/**
 * Check if Redis is connected
 * @returns {boolean}
 */
function isRedisConnected() {
  return isConnected;
}

module.exports = {
  initializeRedis,
  getCache,
  setCache,
  deleteCache,
  deletePattern,
  clearCache,
  closeRedis,
  isRedisConnected,
};
