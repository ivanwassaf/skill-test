const { getCache, setCache, deletePattern } = require('../config/redis');
const { logger } = require('../config');

/**
 * Cache middleware for GET requests
 * @param {number} ttl - Time to live in seconds (default: 300 = 5 minutes)
 * @param {function} keyGenerator - Optional function to generate cache key from req
 * @returns {function} Express middleware
 */
function cacheMiddleware(ttl = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `cache:${req.originalUrl || req.url}`;

      // Try to get from cache
      const cachedData = await getCache(cacheKey);

      if (cachedData) {
        logger.http('Serving from cache', { key: cacheKey });
        return res.json(cachedData);
      }

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setCache(cacheKey, data, ttl).catch(err => {
            logger.error('Failed to cache response', { key: cacheKey, error: err.message });
          });
        }
        
        // Call original json function
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next(); // Continue without cache on error
    }
  };
}

/**
 * Invalidate cache for a specific pattern
 * Use this in POST/PUT/DELETE handlers to clear related cache
 * @param {string|string[]} patterns - Cache key pattern(s) to invalidate
 * @returns {function} Express middleware
 */
function invalidateCache(patterns) {
  return async (req, res, next) => {
    // Store original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json to invalidate cache after response
    res.json = async function(data) {
      // Only invalidate on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];
        
        for (const pattern of patternArray) {
          try {
            const resolvedPattern = typeof pattern === 'function' 
              ? pattern(req) 
              : pattern;
            
            await deletePattern(resolvedPattern);
            logger.debug('Cache invalidated', { pattern: resolvedPattern });
          } catch (error) {
            logger.error('Failed to invalidate cache', { 
              pattern, 
              error: error.message 
            });
          }
        }
      }
      
      // Call original json function
      return originalJson(data);
    };

    next();
  };
}

/**
 * Key generator functions for common patterns
 */
const keyGenerators = {
  /**
   * Generate key for resource list (e.g., /api/v1/students?class_id=1)
   */
  list: (resource) => (req) => {
    const queryString = new URLSearchParams(req.query).toString();
    return `cache:${resource}:list${queryString ? `:${queryString}` : ''}`;
  },

  /**
   * Generate key for single resource (e.g., /api/v1/students/123)
   */
  detail: (resource) => (req) => {
    const id = req.params.id || req.params.studentId || req.params.certificateId;
    return `cache:${resource}:detail:${id}`;
  },

  /**
   * Generate key for user-specific data
   */
  user: (resource) => (req) => {
    const userId = req.user?.id || 'anonymous';
    return `cache:${resource}:user:${userId}`;
  },
};

/**
 * Cache patterns for common resources
 */
const cachePatterns = {
  students: {
    list: 'cache:students:list*',
    detail: (id) => `cache:students:detail:${id}`,
    all: 'cache:students:*',
  },
  classes: {
    list: 'cache:classes:list*',
    detail: (id) => `cache:classes:detail:${id}`,
    all: 'cache:classes:*',
  },
  departments: {
    list: 'cache:departments:list*',
    detail: (id) => `cache:departments:detail:${id}`,
    all: 'cache:departments:*',
  },
  certificates: {
    list: 'cache:certificates:list*',
    detail: (id) => `cache:certificates:detail:${id}`,
    student: (studentId) => `cache:certificates:student:${studentId}*`,
    all: 'cache:certificates:*',
  },
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  keyGenerators,
  cachePatterns,
};
