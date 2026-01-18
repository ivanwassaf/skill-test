require('dotenv').config();
const { validateEnv, logger } = require("./config");

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

// Initialize blockchain service (optional - won't crash if not configured)
blockchainService.initialize().then((initialized) => {
  if (initialized) {
    logger.info('🔗 Blockchain service ready');
  } else {
    logger.info('ℹ️  Blockchain service not configured (optional feature)');
  }
}).catch(err => {
  logger.warn('⚠️  Blockchain initialization error:', err.message);
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 API URL: ${process.env.API_URL}`);
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
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});
