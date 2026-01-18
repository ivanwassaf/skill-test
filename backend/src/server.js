require('dotenv').config();
const { validateEnv, logger, redis } = require("./config");

// Validate environment variables before starting
try {
  validateEnv();
} catch (error) {
  process.exit(1);
}

const { app } = require("./app.js");
const { env } = require("./config");
const { blockchainService } = require("./modules/certificates");

const PORT = env.PORT;

// Initialize services
async function initializeServices() {
  // Initialize Redis cache (optional)
  try {
    await redis.initializeRedis();
  } catch (error) {
    logger.warn('Redis initialization failed, continuing without cache');
  }

  // Initialize blockchain service (optional)
  try {
    const initialized = await blockchainService.initialize();
    if (initialized) {
      logger.info('🔗 Blockchain service ready');
    } else {
      logger.info('ℹ️  Blockchain service not configured (optional feature)');
    }
  } catch (err) {
    logger.warn('⚠️  Blockchain initialization error:', err.message);
  }
}

// Start server
initializeServices().then(() => {
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
    logger.info(`🌐 API URL: ${process.env.API_URL}`);
    logger.info(`💾 Redis cache: ${redis.isRedisConnected() ? 'enabled' : 'disabled'}`);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Exit gracefully
  process.exit(1);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  // Close Redis connection
  await redis.closeRedis();
  
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
