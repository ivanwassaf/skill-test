const Joi = require('joi');
const logger = require('./logger');

/**
 * Environment variables schema
 */
const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(5007),
  
  // Database
  DATABASE_URL: Joi.string().required()
    .description('PostgreSQL connection string'),
  
  // JWT
  JWT_ACCESS_TOKEN_SECRET: Joi.string().min(32).required()
    .description('JWT access token secret (min 32 characters)'),
  JWT_REFRESH_TOKEN_SECRET: Joi.string().min(32).required()
    .description('JWT refresh token secret (min 32 characters)'),
  JWT_ACCESS_TOKEN_TIME_IN_MS: Joi.number().default(900000),
  JWT_REFRESH_TOKEN_TIME_IN_MS: Joi.number().default(28800000),
  
  // CSRF
  CSRF_TOKEN_SECRET: Joi.string().min(32).required()
    .description('CSRF token secret (min 32 characters)'),
  CSRF_TOKEN_TIME_IN_MS: Joi.number().default(950000),
  
  // Email
  MAIL_FROM_USER: Joi.string().email().required(),
  RESEND_API_KEY: Joi.string().optional(),
  
  // Email Verification
  EMAIL_VERIFICATION_TOKEN_SECRET: Joi.string().min(32).required(),
  EMAIL_VERIFICATION_TOKEN_TIME_IN_MS: Joi.number().default(18000000),
  
  // Password Setup
  PASSWORD_SETUP_TOKEN_SECRET: Joi.string().min(32).required(),
  PASSWORD_SETUP_TOKEN_TIME_IN_MS: Joi.number().default(300000),
  
  // URLs
  UI_URL: Joi.string().uri().required(),
  API_URL: Joi.string().uri().required(),
  
  // Cookie
  COOKIE_DOMAIN: Joi.string().required(),
  
  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'debug')
    .default('info'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Blockchain (Optional)
  BLOCKCHAIN_NETWORK: Joi.string().optional(),
  BLOCKCHAIN_PRIVATE_KEY: Joi.string().optional(),
  BLOCKCHAIN_CONTRACT_ADDRESS: Joi.string().optional(),
  LOCALHOST_RPC_URL: Joi.string().uri().optional(),
  SEPOLIA_RPC_URL: Joi.string().uri().optional(),
  POLYGON_RPC_URL: Joi.string().uri().optional(),
  MUMBAI_RPC_URL: Joi.string().uri().optional(),
  
  // IPFS (Optional)
  PINATA_API_KEY: Joi.string().optional(),
  PINATA_SECRET_KEY: Joi.string().optional(),
}).unknown(true); // Allow other environment variables

/**
 * Validate environment variables
 */
function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const errorMessages = error.details.map(detail => {
      return `  - ${detail.message}`;
    }).join('\n');

    logger.error('❌ Environment validation failed:');
    logger.error(errorMessages);
    logger.error('\n💡 Please check your .env file and ensure all required variables are set correctly.');
    logger.error('📝 See .env.example for reference.\n');
    
    throw new Error('Environment validation failed');
  }

  logger.info('✅ Environment variables validated successfully');
  return value;
}

/**
 * Get validated environment configuration
 */
function getConfig() {
  return {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 5007,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
    
    database: {
      url: process.env.DATABASE_URL,
    },
    
    jwt: {
      accessSecret: process.env.JWT_ACCESS_TOKEN_SECRET,
      refreshSecret: process.env.JWT_REFRESH_TOKEN_SECRET,
      accessExpiry: parseInt(process.env.JWT_ACCESS_TOKEN_TIME_IN_MS),
      refreshExpiry: parseInt(process.env.JWT_REFRESH_TOKEN_TIME_IN_MS),
    },
    
    csrf: {
      secret: process.env.CSRF_TOKEN_SECRET,
      expiry: parseInt(process.env.CSRF_TOKEN_TIME_IN_MS),
    },
    
    email: {
      from: process.env.MAIL_FROM_USER,
      apiKey: process.env.RESEND_API_KEY,
      verification: {
        secret: process.env.EMAIL_VERIFICATION_TOKEN_SECRET,
        expiry: parseInt(process.env.EMAIL_VERIFICATION_TOKEN_TIME_IN_MS),
      },
      passwordSetup: {
        secret: process.env.PASSWORD_SETUP_TOKEN_SECRET,
        expiry: parseInt(process.env.PASSWORD_SETUP_TOKEN_TIME_IN_MS),
      },
    },
    
    urls: {
      ui: process.env.UI_URL,
      api: process.env.API_URL,
    },
    
    cookie: {
      domain: process.env.COOKIE_DOMAIN,
    },
    
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
    
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    },
    
    blockchain: {
      enabled: !!(process.env.BLOCKCHAIN_PRIVATE_KEY && process.env.BLOCKCHAIN_CONTRACT_ADDRESS),
      network: process.env.BLOCKCHAIN_NETWORK,
      privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY,
      contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
      rpcUrls: {
        localhost: process.env.LOCALHOST_RPC_URL,
        sepolia: process.env.SEPOLIA_RPC_URL,
        polygon: process.env.POLYGON_RPC_URL,
        mumbai: process.env.MUMBAI_RPC_URL,
      },
    },
    
    ipfs: {
      enabled: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY),
      apiKey: process.env.PINATA_API_KEY,
      secretKey: process.env.PINATA_SECRET_KEY,
    },
  };
}

module.exports = {
  validateEnv,
  getConfig,
};
