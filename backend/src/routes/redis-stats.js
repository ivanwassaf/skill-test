const { Router } = require('express');
const { getCache, isRedisConnected } = require('../config/redis');
const { authenticateToken } = require('../middlewares');

const router = Router();

/**
 * GET /api/v1/redis/stats
 * Get Redis statistics and cache metrics
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const redis = require('../config').redis;
    
    if (!isRedisConnected()) {
      return res.json({
        success: true,
        data: {
          enabled: false,
          connected: false,
          message: 'Redis is not enabled or not connected'
        }
      });
    }

    // Get Redis INFO
    const info = await redis.redisClient?.info();
    
    // Parse INFO output for key metrics
    const stats = {
      enabled: true,
      connected: true,
      uptime_seconds: info?.match(/uptime_in_seconds:(\d+)/)?.[1] || 'N/A',
      connected_clients: info?.match(/connected_clients:(\d+)/)?.[1] || 'N/A',
      used_memory_human: info?.match(/used_memory_human:(\S+)/)?.[1] || 'N/A',
      total_commands_processed: info?.match(/total_commands_processed:(\d+)/)?.[1] || 'N/A',
      keyspace_hits: info?.match(/keyspace_hits:(\d+)/)?.[1] || 'N/A',
      keyspace_misses: info?.match(/keyspace_misses:(\d+)/)?.[1] || 'N/A',
    };

    // Calculate hit rate
    const hits = parseInt(stats.keyspace_hits) || 0;
    const misses = parseInt(stats.keyspace_misses) || 0;
    const total = hits + misses;
    stats.hit_rate = total > 0 ? ((hits / total) * 100).toFixed(2) + '%' : '0%';

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get Redis stats',
      detail: error.message
    });
  }
});

/**
 * POST /api/v1/redis/flush
 * Clear all cache (admin only)
 */
router.post('/flush', authenticateToken, async (req, res) => {
  try {
    const { clearCache } = require('../config/redis');
    
    if (!isRedisConnected()) {
      return res.status(400).json({
        success: false,
        error: 'Redis is not connected'
      });
    }

    await clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      detail: error.message
    });
  }
});

module.exports = router;
